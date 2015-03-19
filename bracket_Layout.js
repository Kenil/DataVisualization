var nodeColor = "lightsteelblue",
    nodeColorOpacity = "0.5",
    nodeBorderColor = "steelblue",
    linkColor = "steelblue",
    linkWidth = "1.5px",
    linkColorOpacity = "0.5",
    selectedAttribute = "Default",
    maxAces = 0,
    maxError = 0;

var margin = {
        top: 40,
        right: 240,
        bottom: 40,
        left: 240
    },
    width = 1500 - margin.left - margin.right,
    halfWidth = width / 2,
    height = 800 - margin.top - margin.bottom,
    i = 0,
    duration = 500,
    root;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) {
        return [d.y, d.x];
    });

var getChildren = function(d) {
    var a = [];
    if (d.leftChallengers)
        for (var i = 0; i < d.leftChallengers.length; i++) {
            d.leftChallengers[i].isRight = false;
            d.leftChallengers[i].parent = d;
            a.push(d.leftChallengers[i]);
        }
    if (d.rightChallengers)
        for (var i = 0; i < d.rightChallengers.length; i++) {
            d.rightChallengers[i].isRight = true;
            d.rightChallengers[i].parent = d;
            a.push(d.rightChallengers[i]);
        }
    return a.length ? a : null;
};

var elbow = function(d, i) {
    var source = calcLeft(d.source);
    var target = calcLeft(d.target);
    var hy = (target.y - source.y) / 2;
    if (d.isRight) hy = -hy;
    return "M" + source.y + "," + source.x + "H" + (source.y + hy) + "V" + target.x + "H" + target.y;
};
var connector = elbow;

var calcLeft = function(d) {
    var l = d.y;
    if (!d.isRight) {
        l = d.y - halfWidth;
        l = halfWidth - l;
    }
    return {
        x: d.x,
        y: l
    };
};

var vis = d3.select("#chart").append("svg:svg")
    .attr("class","svg_container")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .style("overflow", "scroll")
    .append("g")
    .attr("class","drawarea")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function createTree(jsonFileName) {
    console.log("==============> FILE NAME = " + jsonFileName);

    treeJSON = d3.json(jsonFileName, function (json) {

        root = json;
        root.x0 = height / 2;
        root.y0 = 0;

        var t1 = d3.layout.tree().size([height, halfWidth]).children(function (d) {
                return d.leftChallengers;
            }),
            t2 = d3.layout.tree().size([height, halfWidth]).children(function (d) {
                return d.rightChallengers;
            });
        t1.nodes(root);
        t2.nodes(root);

        var rebuildChildren = function (node) {
            if (parseInt(node.ace) > maxAces)
                maxAces = node.ace;
            if (parseInt(node.errors) > maxError)
                maxError = node.errors;

            node.children = getChildren(node);
            if (node.children) node.children.forEach(rebuildChildren);
        }

        rebuildChildren(root);
        root.isRight = false;
        collapse(root);
        update(root);
    });
}
var toArray = function(item, arr) {
    arr = arr || [];
    var i = 0,
        l = item.children ? item.children.length : 0;
    arr.push(item);
    for (; i < l; i++) {
        toArray(item.children[i], arr);
    }
    return arr;
};

var tempInnerHTML = null;

function update(source) {
    var duration = d3.event && d3.event.altKey ? 5000 : 500;

// Compute the new tree layout.
    var nodes = toArray(source);

// Normalize for fixed-depth.
    nodes.forEach(function(d) {
        d.y = d.depth * 180 + halfWidth;

    });
// Update the nodes…
    var node = vis.selectAll("g.node")
        .data(nodes, function(d) {
            return d.id || (d.id = ++i);
        });

// Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", click)
        .on("mouseover", function(d) {
            var nameDiv = document.getElementById('head');
            nameDiv.innerHTML = d.name + ' (' + d.country + ')';

            var roundDiv = document.getElementById('header2');
            if (d.round == 'Winner') {
                roundDiv.innerHTML = d.year + ' Champion';

                var innerToolTipDiv = document.getElementById('innerToolTip');
                if (!tempInnerHTML)
                    tempInnerHTML = innerToolTipDiv.innerHTML;
                innerToolTipDiv.innerHTML = '';
                innerToolTipDiv.style.left = "150px";
                var img = document.createElement("img");
                var imgURL = imageURLByYear[d.year];
                img.src = imgURL;
                img.id = "playerPic";
                img.style.height = '80px';
                img.style.width = '100px';
                innerToolTipDiv.appendChild(img);
            } else {

                var innerToolTipDiv = document.getElementById('innerToolTip');
                innerToolTipDiv.style.left = "35px";
                innerToolTipDiv.innerHTML = tempInnerHTML;
                roundDiv.innerHTML = d.round + ' Round';

                var accuracyDiv = document.getElementById('accuracyValue');
                if (d.firstServe)
                    accuracyDiv.innerHTML = d.firstServe;
                else
                    accuracyDiv.innerHTML = 'N/A';
                var acesDiv = document.getElementById('acesValue');
                if (d.ace)
                    acesDiv.innerHTML = d.ace;
                else
                    acesDiv.innerHTML = 'N/A';

                var errorsDiv = document.getElementById('errorsValue');
                if (d.errors)
                    errorsDiv.innerHTML = d.errors;
                else
                    errorsDiv.innerHTML = 'N/A';

            }
            var r = d3.select(this).node().getBoundingClientRect();
            d3.select("div#toolTip")
                .style("display", "inline")
                .style("top", (d3.event.pageY) + "px")
                .style("left", (d3.event.pageX) + "px")
                .style("position", "absolute");
        })
        .on("mouseout", function() {
            d3.select("div#toolTip").style("display", "none")
        });


    nodeEnter.append("svg:circle")
        .attr("r", 1e-6)
        .style("border-radius", "5px")
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        });

    nodeEnter.append("svg:text")
        .attr("dy", function(d) {
            return d.children ? "0em" : "-2em"
        })
        .attr("text-anchor", function(d) {
            return d.children || d._children ? "middle" : "start";
        })
        .text(function(d) {
            return d.name;
        })
        .style("fill-opacity", 1e-6);

// Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) {
            p = calcLeft(d);
            return "translate(" + p.y + "," + p.x + ")";
        });

    nodeUpdate.select("circle")
        .attr("r", 5)
        .style("stroke", nodeBorderColor)
        .style("fill", function(d) {
            return d._children ? nodeColor : "#fff";
        });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

// Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) {
            p = calcLeft(d.parent || source);
            return "translate(" + p.y + "," + p.x + ")";
        })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

// Update the links...
    var link = vis.selectAll("path.link")
        .data(tree.links(nodes), function(d) {
            return d.target.id;
        });

// Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .style("stroke-linecap", "round")
        .style("stroke-width", function(d) {
            return calculateStrokeWidth(d.target);
        })
        .style("stroke", linkColor)
        .style("stroke-opacity", linkColorOpacity)
        .attr("d", function(d) {
            var o = {
                x: source.x0,
                y: source.y0
            };
            return connector({
                source: o,
                target: o
            });
        })
        .on("mouseover", function(d) {
            console.log("HELLOWORLD");
        });

// Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", connector);

// Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
            var o = calcLeft(d.source || source);
            if (d.source.isRight) o.y -= halfWidth - (d.target.y - d.source.y);
            else o.y += halfWidth - (d.target.y - d.source.y);
            return connector({
                source: o,
                target: o
            });
        })
        .remove();

// Stash the old positions for transition.
    nodes.forEach(function(d) {
        var p = calcLeft(d);
        d.x0 = p.x;
        d.y0 = p.y;
    });

    d3.select("svg")
        .call(d3.behavior.zoom()
            .scaleExtent([0.5, 5])
            .on("zoom", zoom));

// Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(source);
    }
}

function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function zoom() {
    var scale = d3.event.scale,
        translation = d3.event.translate,
        tbound = -height * scale,
        bbound = height * scale,
        lbound = (-width + margin.left) * scale,
        rbound = (width - margin.right) * scale;
// limit translation to thresholds
    translation = [
        Math.max(Math.min(translation[0], rbound), lbound),
        Math.max(Math.min(translation[1], bbound), tbound)
    ];
    d3.select(".drawarea")
        .attr("transform", "translate(" + translation + ")" +
        " scale(" + scale + ")");
}

function selectAttribute(name) {
    console.log(name);
    selectedAttribute = name;
    setNodeColor();
}

$('.dropdown li a').click(function(event) {
    event.preventDefault();
    var target = $(event.target);
    console.log(target.text());
    $(".dropdown-toggle").text(target.text());
    $(".dropdown-toggle").val(target.text());
    createTree("data/" + target.text() + ".json");
});

function setNodeColor() {
    if (selectedAttribute == "Default") {
        nodeColor = "lightsteelblue",
            nodeColorOpacity = "1.0",
            nodeBorderColor = "steelblue",
            linkColor = "steelblue",
            linkWidth = "1.5x",
            linkColorOpacity = "1.0"
    } else if (selectedAttribute == "Accuracy") {
        nodeColor = "#5cb85c",
            nodeColorOpacity = "0.5",
            nodeBorderColor = "#006400",
            linkColor = "#5cb85c",
            linkWidth = "1.5x",
            linkColorOpacity = "0.5"
    } else if (selectedAttribute == "Aces") {
        nodeColor = "#f0ad4e",
            nodeColorOpacity = "0.5",
            nodeBorderColor = "#A04000",
            linkColor = "#f0ad4e",
            linkWidth = "1.5x",
            linkColorOpacity = "0.5"
    } else if (selectedAttribute == "Errors") {
        nodeColor = "#d9534f",
            nodeColorOpacity = "0.5",
            nodeBorderColor = "#800000",
            linkColor = "#d9534f",
            linkWidth = "1.5x",
            linkColorOpacity = "0.5"
    }

}

function calculateStrokeWidth(d) {
    var temp = null, linkWidthTemp;
    if(selectedAttribute == "Default") {
        linkWidth =  "1.5px";
    } else if(selectedAttribute == "Accuracy") {
        temp = (parseFloat(d.accuracy) / 100) * 50;
        linkWidth = temp + "px";
    } else if(selectedAttribute == "Aces") {
        temp = parseInt((parseInt(d.ace) * 50)/maxAces);
        linkWidth = temp + "px";
    } else if(selectedAttribute == "Errors") {
        console.log(d.name);
        temp = parseInt((parseInt(d.errors) * 50)/maxError);
        linkWidth = temp + "px";
    }

    linkWidthTemp = linkWidth;
    return linkWidthTemp;
}

var botao = d3.select("#form #button");

var imageURLByYear = {
    '2004': 'http://the-tennis-freaks.com/wp-content/uploads/2011/12/272647-roger-federer-wins-australian-open.jpg',
    '2005': 'http://tennis-pronostics.com/sites/default/files/winnercup/safin_australie_2005.jpg',
    '2006': 'http://the-tennis-freaks.com/wp-content/uploads/2011/12/272647-roger-federer-wins-australian-open.jpg',
    '2007': 'http://the-tennis-freaks.com/wp-content/uploads/2011/12/272647-roger-federer-wins-australian-open.jpg',
    '2008': 'http://jordantimes.com/uploads/repository/26bd4d02fb5a81d6cce3b33b167f6a1dde5c2578.jpg',
    '2009': 'http://i.telegraph.co.uk/multimedia/archive/01250/rafael-nadal_1250974c.jpg',
    '2010': 'http://the-tennis-freaks.com/wp-content/uploads/2011/12/272647-roger-federer-wins-australian-open.jpg',
    '2011': 'http://jordantimes.com/uploads/repository/26bd4d02fb5a81d6cce3b33b167f6a1dde5c2578.jpg',
    '2012': 'http://jordantimes.com/uploads/repository/26bd4d02fb5a81d6cce3b33b167f6a1dde5c2578.jpg',
    '2013': 'http://jordantimes.com/uploads/repository/26bd4d02fb5a81d6cce3b33b167f6a1dde5c2578.jpg',
    '2014': 'http://www.standard.co.uk/incoming/article9087270.ece/alternates/w620/66STAN2701A.jpg'
}
var nodeColor = "lightsteelblue",
    nodeColorOpacity = "0.5",
    nodeBorderColor = "steelblue",
    linkColor = "steelblue",
    linkWidth = "1.5px",
    linkColorOpacity = "0.5",
    selectedAttribute = "None",
    maxAces = 0,
    maxError = 0,
    tempInnerHTML = null;

var m = [20, 120, 20, 120],
    w = 1600 - m[1] - m[3],
    h = 800 - m[0] - m[2],
    i = 0,
    root;

var tree = d3.layout.tree()
    .size([h, w]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.y, d.x]; });

var vis = d3.select("#chart").append("svg:svg")
    .attr("class","svg_container")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .style("overflow", "scroll")
    .append("g")
    .attr("class","drawarea")
    .attr("transform", "translate(" + m[3] + "," + m[0] + ")");

d3.select("svg")
    .call(d3.behavior.zoom()
        .scaleExtent([0.5, 5])
        .on("zoom", zoom));

function createTree(jsonFileName) {

    d3.json(jsonFileName, function(json) {
        root = json;
        root.x0 = h / 2;
        root.y0 = 0;

        function toggleAll(d) {

            if (parseInt(d.ace) > maxAces)
                maxAces = d.ace;
            if (parseInt(d.forcedErrors) > maxError)
                maxError = d.forcedErrors;
            if (d.children) {
                d.children.forEach(toggleAll);
                toggle(d);
            }
        }

        toggleAll(root);
        update(root);
    });
}

function update(source) {
    var duration = d3.event && d3.event.altKey ? 5000 : 500;

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 180; });

    // Update the nodes…
    var node = vis.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); })

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) {
            return "translate(" + source.y0 + "," + source.x0 + ")";
        })
        .on("click", function(d) { toggle(d); update(d); })
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

                var serveDiv = document.getElementById('serveValue');
                if (d.firstServe)
                    serveDiv.innerHTML = d.firstServe;
                else
                    serveDiv.innerHTML = 'N/A';
                var acesDiv = document.getElementById('acesValue');
                if (d.ace)
                    acesDiv.innerHTML = d.ace;
                else
                    acesDiv.innerHTML = 'N/A';

                var errorsDiv = document.getElementById('errorsValue');
                if (d.forcedErrors)
                    errorsDiv.innerHTML = d.forcedErrors;
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
        .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
        .attr("dy", ".35em")
        .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6);

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

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
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links...
    var link = vis.selectAll("path.link")
        .data(links, function(d) {
            return d.target.id;
        });

    // Enter any new links at the parent's previous position.
    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        })
        .transition()
        .duration(duration)
        .attr("d", diagonal);

    // Transition links to their new position.
    var linkUpdate =  link.transition()
        .duration(duration)
        .attr("d", diagonal);

    linkUpdate
        .style("stroke-linecap", "round")
        .style("stroke-width", function(d) {
            return calculateStrokeWidth(d.target);
        })
        .style("stroke", linkColor)
        .style("stroke-opacity", linkColorOpacity);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        })
        .remove();

    // Update the link text
    var linktext = vis.selectAll("g.link")
        .data(links, function (d) {
            return d.target.id;
        });

    linktext.enter()
        .insert("g")
        .attr("class", "link")
        .append("text")
        .attr("dy", ".35em")
        .attr("text-anchor", "middle")
        .text(function (d) {
            return findTextToDisplay(d);
        });

    // Transition link text to their new positions
    var linkTextUpdate = linktext.transition()
        .duration(duration)
        .attr("transform", function (d) {
            return "translate(" + ((d.source.y + d.target.y) / 2) + "," + ((d.source.x + d.target.x) / 2) + ")";
        })

    //Transition exiting link text to the parent's new position.
    linktext.exit().transition()
        .remove();

    linkTextUpdate.select("text")
        .text(function (d) {
            return findTextToDisplay(d);
        });


    // Stash the old positions for transition.
    nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
    });

}

// Toggle children.
function toggle(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else {
        d.children = d._children;
        d._children = null;
    }
}

function zoom() {
    var scale = d3.event.scale,
        translation = d3.event.translate,
        tbound = -h * scale,
        bbound = h * scale,
        lbound = (-w + m[3]) * scale,
        rbound = (w - m[1]) * scale;
    // limit translation to thresholds
    translation = [
        Math.max(Math.min(translation[0], rbound), lbound),
        Math.max(Math.min(translation[1], bbound), tbound)
    ];
    d3.select(".drawarea")
        .attr("transform", "translate(" + translation + ")" +
        " scale(" + scale + ")");
}



$('body').on('click', '.btn-group-vertical button', function (e) {
    $(this).addClass('active');
    $(this).siblings().removeClass('active');

    var attName = e.target.textContent.trim();

    selectedAttribute = attName;
    setNodeColor();
    if (root)
       update(root);
});

$('.dropdown li a').click(function(event) {
    event.preventDefault();
    var target = $(event.target);
    $(".dropdown-toggle").text(target.text());
    $(".dropdown-toggle").val(target.text());
    createTree("data/" + target.text() + ".json");
});

function setNodeColor() {
    if (selectedAttribute == "None") {
        nodeColor = "lightsteelblue",
            nodeColorOpacity = "0.5",
            nodeBorderColor = "steelblue",
            linkColor = "steelblue",
            linkWidth = "1.5x",
            linkColorOpacity = "0.5"
    } else if (selectedAttribute == "1st Serve") {
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
    if(selectedAttribute == "None") {
        linkWidth =  "1.5px";
    } else if(selectedAttribute == "1st Serve") {
        if (d.firstServe)
            temp = (parseFloat(d.firstServe) / 100) * 50;
        else
            temp = "1.5";
        linkWidth = temp + "px";
    } else if(selectedAttribute == "Aces") {
        if (d.ace)
            temp = parseInt((parseInt(d.ace) * 50)/maxAces);
        else
            temp = "1.5";
        linkWidth = temp + "px";
    } else if(selectedAttribute == "Errors") {
        if (d.forcedErrors)
            temp = parseInt((parseInt(d.forcedErrors) * 50)/maxError);
        else
            temp = "1.5";
        linkWidth = temp + "px";
    }

    linkWidthTemp = linkWidth;
    return linkWidthTemp;
}

function findTextToDisplay(d) {
    var node = d.target;

    var tempText = null;
    if(selectedAttribute == "None") {
        tempText =  " ";
    } else if(selectedAttribute == "1st Serve") {
        if (node.firstServe)
            tempText = node.firstServe;
        else
            tempText = "N/A";
    } else if(selectedAttribute == "Aces") {
        if (node.ace)
            tempText = node.ace;
        else
            tempText = "N/A";
    } else if(selectedAttribute == "Errors") {
        if (node.forcedErrors)
            tempText = node.forcedErrors;
        else
            tempText = "N/A";
    }

    return tempText;
}

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
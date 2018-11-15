$(() => {
    const vscode = acquireVsCodeApi();
    const svg = $('svg')
    svg.find("g.node").on("mouseover", function(e) {
        $(this).find("polygon").attr("stroke", "green");
        $(this).find("polygon").attr("stroke-width", "4");
        $(this).find("ellipse").attr("stroke", "red");
        $(this).find("ellipse").attr("stroke-width", "4");
    });
    svg.find("g.node").on("mouseout", function(e) {
        $(this).find("polygon").attr("stroke", "black");
        $(this).find("polygon").attr("stroke-width", "1");
        $(this).find("ellipse").attr("stroke", "black");
        $(this).find("ellipse").attr("stroke-width", "1");
    });
    svg.find("g.node").on("click", function(e) {
        var text = $(this).find("title").text().trim();
        if ($(this).find("ellipse").length !== 0) {
            vscode.postMessage({
                'command': 'end-click',
                'text': text
            });
        } else {
        }
        vscode.postMessage({
            'command': 'page-click',
            'text': text
        })
    });
})
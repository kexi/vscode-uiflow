
let $ = require('jquery');

window.render = function (dot) {
    d3.select("#graph").graphviz().renderDot(dot).on('end', function() {
        const imgstart = 'data:image/svg+xml;base64,';
        
        let cnv = $('#canva'), img = $('#img'), svg = $('#graph svg')[0];
        
        let {width, height} = svg.getBBox(); 
        let clonedSVG = svg.cloneNode(true);
        let outerHTML = clonedSVG.outerHTML;
        let blob = new Blob([outerHTML],{type:'image/svg+xml;charset=utf-8'});
        let URL = window.URL || window.webkitURL || window;
        let blobURL = URL.createObjectURL(blob);
        let image = new Image();
        image.onload = () => {
            let canvas = document.createElement('canvas');
            canvas.widht = width;
            canvas.height = height;
            let context = canvas.getContext('2d');
            context.fillStyle ='#fff';
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height );
            $('#data_url_png').val(canvas.toDataURL('image/png'));
            $('#data_url_jpg').val(canvas.toDataURL('image/jpeg'));
            $('#data_url_webp').val(canvas.toDataURL('image/webp'));
            $('#svg_src').val(outerHTML);
        };
        image.src = blobURL;
        
    });
};


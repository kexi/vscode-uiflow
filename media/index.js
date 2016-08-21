$(function () {
	var cnv = $('canvas'), img = $('#img'), svg = $('svg');
	var w = svg.width(), h = svg.height();
	cnv.attr({width: w, height: h});
	var ctx = cnv[0].getContext('2d');
	ctx.fillStyle ='#fff';
	ctx.fillRect(0, 0, w, h);
	ctx.drawImage(img[0], 0, 0, w, h);
	let url = cnv[0].toDataURL('image/png');
	$('#export').attr('href', 'command:uiflow.saveImage?' +encodeURIComponent(JSON.stringify(url)));
});

$(() => {
	const vscode = acquireVsCodeApi();
	let cnv = $('canvas'), img = $('#img'), svg = $('svg');
	let w = svg.width(), h = svg.height();
	cnv.attr({width: w, height: h});
	let ctx = cnv[0].getContext('2d');
	ctx.fillStyle ='#fff';
	ctx.fillRect(0, 0, w, h);
	ctx.drawImage(img[0], 0, 0, w, h);
	$('#export').click(() => {
		const url = cnv[0].toDataURL('image/png');
		vscode.postMessage({
			command: 'save-png',
			url: url
		})
	})
});

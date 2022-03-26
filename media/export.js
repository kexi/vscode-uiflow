
const vscode = acquireVsCodeApi();
$(window).on("load", function() {
	let cnv = $('#canva');
	$('#export').click(() => {
		const url = cnv[0].toDataURL('image/png');
		vscode.postMessage({
			command: 'save-png',
			url: url
		});
	});
});

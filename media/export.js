
const vscode = acquireVsCodeApi();
$(window).on("load", function() {
	$('#export').click(() => {
		let dataURL = $('#data_url').val();
		console.error(dataURL);
		vscode.postMessage({
			command: 'save-png',
			url: dataURL
		});
	});
});

(function(window, undefined) {


	var el_my_result = document.getElementById('my_result'),
		el_take_snapshot = document.querySelector('.take_snapshop');

	Webcam.set({
        image_format: 'png'
	});

	Webcam.attach('#my_camera');


	/*
	function take_snapshot() {
		Webcam.snap(function (data_uri) {
			el_my_result.innerHTML = '<img id="my-image" src="' + data_uri + '"/>';
		});
	}
	*/

	el_take_snapshot.addEventListener('click', function () {
		take_snapshot_to_canvas();
	}.bind(this));

	// canvas manip
	function take_snapshot_to_canvas() {
		/*
		var canvas = new fabric.Canvas('myCanvas');
		var imgElement = document.getElementById('my-image');
		var imgInstance = new fabric.Image(imgElement, {
		  left: 100,
		  top: 100,
		  angle: 30,
		  opacity: 0.85
		});
		canvas.add(imgInstance);
		*/

		Webcam.snap( function (data_uri) {

			var img = new Image();
			img.src = data_uri;

			var canvas = new fabric.Canvas('myCanvas', {
				width: 320,
				height: 240
			});

			var imgInstance = new fabric.Image(img, {
			  left: 0,
			  top: 0
			});
			canvas.add(imgInstance);


			el_my_result.innerHTML = '<img id="my-image" src="' + data_uri + '"/>';

		});

	}

})(window);
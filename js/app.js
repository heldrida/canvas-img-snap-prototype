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

	var stage = new createjs.Stage("myCanvas"),
		container = new createjs.Container(),
		image = false;

	stage.canvas.width = 320;
	stage.canvas.height = 240;

	/*
	createjs.Ticker.addEventListener("tick", handleTick);

	function handleTick(event) {
		stage.update();
	}
	*/

	// canvas manip
	function take_snapshot_to_canvas() {

		Webcam.snap( function (data_uri) {

			// reset
			stage.removeAllChildren();
 			stage.removeAllEventListeners();

			image = new createjs.Bitmap(data_uri);

			container.on('mousedown', function (evt) {

				var offset = {
					x: evt.target.x - evt.stageX,
					y: evt.target.y - evt.stageY
				};

				evt.target.on("pressmove", function (evt) {
					evt.target.x = evt.stageX + offset.x;
					evt.target.y = evt.stageY + offset.y;
					stage.update();
				});

			});

			container.addChild(image);

			stage.addChild(container);

			stage.update();

		});

	}

})(window);
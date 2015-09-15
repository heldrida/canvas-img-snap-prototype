(function(window, undefined) {

	function CanvasImageSnapper() {
		this.init();
	}

	CanvasImageSnapper.prototype = {

		init: function () {

			this.setVars();
			this.setListeners();
			this.setWebcam();

		},

		setVars: function () {

			this.stage = new createjs.Stage('myCanvas');
			this.el_my_result = document.getElementById('my_result');
			this.el_take_snapshot = document.querySelector('.take_snapshop');
			this.container = new createjs.Container();

			this.stage.canvas.width = 320;
			this.stage.canvas.height = 240;

		},

		setListeners: function () {

			createjs.Ticker.addEventListener("tick", this.tickHandler.bind(this));

			this.el_take_snapshot.addEventListener('click', function () {

				Webcam.snap( function (data_uri) {

					this.take_snapshot_to_canvas.call(this, data_uri);

				}.bind(this));

			}.bind(this));

			this.container.on('mousedown', function (evt) {

				var offset = {
					x: evt.target.x - evt.stageX,
					y: evt.target.y - evt.stageY
				};

				evt.target.on("pressmove", function (evt) {
					evt.target.x = evt.stageX + offset.x;
					evt.target.y = evt.stageY + offset.y;
				});

			});

		},

		tickHandler: function () {

			this.stage.update();

		},

		setWebcam: function () {

			Webcam.set({
				image_format: 'png'
			});

			Webcam.attach('#my_camera');

		},

		take_snapshot_to_canvas: function (data_uri) {

			var image = new createjs.Bitmap(data_uri),
				shape = new createjs.Shape();

			shape.graphics.beginFill("#ff0000").drawRect(0, 0, 10, 10);

			this.container.addChild(image, shape);

			this.stage.addChild(this.container);

			this.stage.update();

		}

	};

	var canvasImageSnapper = new CanvasImageSnapper();

})(window);
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
			this.stage.canvas.width = 320;
			this.stage.canvas.height = 240;
			createjs.Touch.enable(this.stage);

			this.el_my_result = document.getElementById('my_result');
			this.el_take_snapshot = document.querySelector('.take_snapshot');
			this.container = new createjs.Container();

			this.dragBox = new createjs.Shape(new createjs.Graphics().beginFill("#FFFFFF").drawRect(0, 0, this.stage.canvas.width, this.stage.canvas.height))
			this.stage.addChild(this.dragBox);

			this.btnPrint = document.querySelector('.btn-print');

		},

		setListeners: function () {

			createjs.Ticker.addEventListener("tick", this.tickHandler.bind(this));

			this.el_take_snapshot.addEventListener('click', function () {

				Webcam.snap( function (data_uri) {

					this.placeImageToCanvas.call(this, data_uri);
					this.placeMask.call(this);
					this.placeResizeHandlers.call(this);

				}.bind(this));

			}.bind(this));

			this.dragBox.addEventListener("mousedown", function (event) {

				var offset = new createjs.Point();

				offset.x = this.stage.mouseX - this.container.x;
				offset.y = this.stage.mouseY - this.container.y;

				event.target.addEventListener("pressmove", function (event) {

					this.container.x = event.stageX - offset.x;
					this.container.y = event.stageY - offset.y;

				}.bind(this));

			}.bind(this));

			this.btnPrint.addEventListener('click', function (e) {
				this.print();
			}.bind(this));

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

		placeImageToCanvas: function (data_uri) {

			// reset
			this.container.removeAllChildren();

			var image = new createjs.Bitmap(data_uri);

			this.container.addChild(image);

			this.stage.addChild(this.container);

		},

		placeMask: function () {

			var img = new createjs.Bitmap('img/mask.png');
			this.stage.addChild(img);
			//this.stage.setChildIndex(img, this.stage.getNumChildren() + 1);

		},

		placeResizeHandlers: function () {

			var shape = new createjs.Shape();

			shape.graphics.beginFill("#FFCC00").drawRect(0, 0, 10, 10);

			this.stage.setChildIndex(shape, this.stage.getNumChildren() + 1);

			this.container.addChild(shape);

			console.log(this.container);

		},

		print: function () {

			this.el_my_result.innerHTML = "<h1>image result:</h1><img src='" + this.stage.canvas.toDataURL("image/png") + "' alt='from canvas'/>";

		},

	};

	var canvasImageSnapper = new CanvasImageSnapper();

})(window);
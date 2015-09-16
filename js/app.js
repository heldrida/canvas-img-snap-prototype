(function(window, undefined) {

	function CanvasImageSnapper() {
		this.init();
	}

	CanvasImageSnapper.prototype = {

		init: function () {

			this.setVars();
			this.setListeners();
			this.setWebcam();
			this.placeMask();

		},

		setVars: function () {

			this.stage = new createjs.Stage('myCanvas');
			this.stage.canvas.width = 320;
			this.stage.canvas.height = 240;
			createjs.Touch.enable(this.stage);

			this.el_my_result = document.getElementById('my_result');
			this.el_take_snapshot = document.querySelector('.take_snapshot');
			this.container = new createjs.Container();
			this.handler_container = new createjs.Container();

			this.dragBox = new createjs.Shape(new createjs.Graphics().beginFill("#FFFFFF").drawRect(0, 0, this.stage.canvas.width, this.stage.canvas.height))
			this.stage.addChild(this.dragBox);

			this.btnPrint = document.querySelector('.btn-print');

			this.snapshot = null;

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

					this.handler_container.x = this.container.x;
					this.handler_container.y = this.container.y;

				}.bind(this));

			}.bind(this));

			this.btnPrint.addEventListener('click', function (e) {
				this.print();
			}.bind(this));

		},

		setShapeListeners: function (arr) {

			arr[0].addEventListener('mousedown', function (event) {

				var offset = new createjs.Point();

				offset.x = this.stage.mouseX - event.target.x;
				offset.y = this.stage.mouseX - event.target.x;

				event.target.addEventListener('pressmove', function (event) {

					arr[0].x = event.stageX - offset.x;
					arr[0].y = event.stageY - offset.y;

					// arr[1].x = Math.abs(event.stageX - offset.x) * -1;
					// arr[1].y = Math.abs(event.stageY - offset.y) * -1;

					console.log('arr[0].x: ', arr[0].x);
					console.log('arr[0].y: ', arr[0].y);

				}.bind(this));

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

			this.snapshot = new createjs.Bitmap(data_uri);

			this.container.addChild(this.snapshot);

			this.stage.addChild(this.container);

		},

		placeMask: function () {

			var img = new createjs.Bitmap('img/mask.png');
			this.stage.addChild(img);
			//this.stage.setChildIndex(img, this.stage.getNumChildren() + 1);

		},

		placeResizeHandlers: function () {

			var shape_size = { w: 10, h: 10 },
				shp1 = new createjs.Shape(), // q4
				shp2 = new createjs.Shape(), // q3
				shp3 = new createjs.Shape(), // q1
				shp4 = new createjs.Shape(); // q2

			shp1.graphics.beginFill("#FFCC00").drawRect(0, 0, shape_size.w, shape_size.h);
			shp2.graphics.beginFill("#FF0000").drawRect(0, this.snapshot.image.height - shape_size.h, shape_size.w, shape_size.h);
			shp3.graphics.beginFill("#00FF00").drawRect(this.snapshot.image.width - shape_size.w, 0, shape_size.w, shape_size.h);
			shp4.graphics.beginFill("#0000FF").drawRect(this.snapshot.image.width - shape_size.w, this.snapshot.image.height - shape_size.h, shape_size.w, shape_size.h);

			this.setShapeListeners([shp1, shp2, shp3, shp4]);

			this.handler_container.addChild(shp1, shp2, shp3, shp4);

			this.stage.addChild(this.handler_container);

		},

		print: function () {

			this.el_my_result.innerHTML = "<h1>image result:</h1><img src='" + this.stage.canvas.toDataURL("image/png") + "' alt='from canvas'/>";

		},

	};

	var canvasImageSnapper = new CanvasImageSnapper();

})(window);
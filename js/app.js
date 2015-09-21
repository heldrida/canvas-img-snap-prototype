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

			this.myCanvas = document.querySelector('#myCanvas');
			this.myCanvas.style.width = window.innerWidth + 'px';
			this.myCanvas.style.height = window.innerWidth / (16/9) + 'px';
			this.myCamera = document.querySelector('#my_camera');
			this.videoStream = this.myCamera.querySelector('video');
			this.stage = new createjs.Stage('myCanvas');
			this.stage.canvas.width = parseInt(this.myCanvas.style.width);
			this.stage.canvas.height = parseInt(this.myCanvas.style.height);
			this.ratio = this.stage.canvas.width / this.stage.canvas.height;
			createjs.Touch.enable(this.stage);

			this.el_my_result = document.getElementById('my_result');
			this.el_take_snapshot = document.querySelector('.take_snapshot');
			this.container = new createjs.Container();
			this.handler_container = new createjs.Container();

			this.dragBox = new createjs.Shape(new createjs.Graphics().beginFill("#FFFFFF").drawRect(0, 0, this.stage.canvas.width, this.stage.canvas.height))
			this.stage.addChild(this.dragBox);

			this.btnPrint = document.querySelector('.btn-print');

			this.snapshot = null;
			this.shape_size = { w: 10, h: 10 };
			this.maskImage;

			this.btnDownload = document.querySelector('.btn-download');

		},

		setListeners: function () {

			// disable to improve performance
			//createjs.Ticker.addEventListener("tick", this.tickHandler.bind(this));

			this.el_take_snapshot.addEventListener('click', function () {

				Webcam.snap( function (data_uri) {

					this.placeImageToCanvas.call(this, data_uri);

					this.placeMask.call(this, this.placeResizeHandlers);

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

					this.stage.update();

				}.bind(this));

			}.bind(this));

			this.btnPrint.addEventListener('click', function (e) {
				this.print();
			}.bind(this));

			window.addEventListener('resize', this.winResizeHandler.bind(this));

			this.btnDownload.addEventListener('click', function () {
				this.downloadImg();
			}.bind(this));

		},

		setShapeListeners: function (obj) {

			var params;

			for (var key in obj) {

				(function (context, key) {

					obj[key].addEventListener('mousedown', function (event) {

						var offset = new createjs.Point();

						offset.x = context.stage.mouseX - event.target.x;
						offset.y = context.stage.mouseY - event.target.y;

						event.target.addEventListener('pressmove', function (event) {

							// keep ratio
							params = {
								'key': key,
								'x': event.stageX - offset.x,
								'y': (event.stageX - offset.x) / this.ratio
							};

							if (context.calcScalePercentage.call(context, params) === false) {
								return false;
							}

							if (key === 'q4') {

								obj.q4.x = params.x;
								obj.q4.y = params.y;

								obj.q3.x = params.x;
								obj.q3.y = params.y * -1;

								obj.q2.x = params.x * -1;
								obj.q2.y = params.y * -1;

								obj.q1.x = params.x * -1;
								obj.q1.y = params.y;

							} else if (key === 'q3') {

								obj.q4.x = params.x;
								obj.q4.y = params.y;

								obj.q3.x = params.x;
								obj.q3.y = params.y * -1;

								obj.q2.x = params.x * -1;
								obj.q2.y = params.y * -1;

								obj.q1.x = params.x * -1;
								obj.q1.y = params.y;

							} else if (key === 'q2') {

								obj.q4.x = params.x < 0 ? Math.abs(params.x) : Math.abs(params.x) * -1;
								obj.q4.y = params.y < 0 ? Math.abs(params.y) : Math.abs(params.y) * -1;

								obj.q3.x = params.x < 0 ? Math.abs(params.x) : Math.abs(params.x) * -1;
								obj.q3.y = params.y < 0 ? Math.abs(params.y) * -1 : Math.abs(params.y);

								obj.q2.x = params.x;
								obj.q2.y = params.y;

								obj.q1.x = params.x < 0 ? Math.abs(params.x) * -1 : Math.abs(params.x);
								obj.q1.y = params.y < 0 ? Math.abs(params.y) : Math.abs(params.y)  * -1;


							} else if (key === 'q1') {

								obj.q4.x = params.x < 0 ? Math.abs(params.x) : Math.abs(params.x) * -1;
								obj.q4.y = params.y < 0 ? Math.abs(params.y) : Math.abs(params.y) * -1;

								obj.q3.x = params.x < 0 ? Math.abs(params.x) : Math.abs(params.x) * -1;
								obj.q3.y = params.y < 0 ? Math.abs(params.y) * -1 : Math.abs(params.y);

								obj.q2.x = params.x < 0 ? Math.abs(params.x) * -1 : Math.abs(params.x);
								obj.q2.y = params.y < 0 ? Math.abs(params.y) * -1 : Math.abs(params.y);

								obj.q1.x = params.x < 0 ? Math.abs(params.x) * -1 : Math.abs(params.x);
								obj.q1.y = params.y < 0 ? Math.abs(params.y) : Math.abs(params.y) * -1;

							}

							context.stage.update();

						}.bind(context));

					}.bind(context));

				}(this, key));

			}

		},

		tickHandler: function () {

			this.stage.update();

		},

		setWebcam: function () {

			Webcam.set({
				width: this.stage.canvas.width,
				height: this.stage.canvas.height,
				dest_width: this.stage.canvas.width,
				dest_height: this.stage.canvas.height,
				image_format: 'png'
			});

			Webcam.attach(this.myCamera);

		},

		placeImageToCanvas: function (data_uri) {

			// reset
			this.container.removeAllChildren();

			this.snapshot = new createjs.Bitmap(data_uri);

			this.container.addChild(this.snapshot);

			this.stage.addChild(this.container);

			this.stage.update();

		},

		placeMask: function (callback) {

			this.maskImage = new createjs.Bitmap('img/mask_v2.png');

			// wrap on a timeout, to allow getting the size of the img el
			setTimeout(function () {

				this.maskImage.scaleX = parseInt(this.myCanvas.style.width) / this.maskImage.image.width;
				this.maskImage.scaleY = parseInt(this.myCanvas.style.height) / this.maskImage.image.height;

				this.stage.addChild(this.maskImage);

				this.stage.update();

				if (typeof callback === "function") {

					callback.call(this);

				}

			}.bind(this), 100);

		},

		placeResizeHandlers: function () {

			var shp1 = new createjs.Shape(), // q4
				shp2 = new createjs.Shape(), // q3
				shp3 = new createjs.Shape(), // q1
				shp4 = new createjs.Shape(); // q2

			shp1.graphics.beginFill("#FFFFFF").drawRect(0, 0, this.shape_size.w, this.shape_size.h);
			shp2.graphics.beginFill("#FFFFFF").drawRect(0, this.snapshot.image.height - this.shape_size.h, this.shape_size.w, this.shape_size.h);
			shp3.graphics.beginFill("#FFFFFF").drawRect(this.snapshot.image.width - this.shape_size.w, this.snapshot.image.height - this.shape_size.h, this.shape_size.w, this.shape_size.h);
			shp4.graphics.beginFill("#FFFFFF").drawRect(this.snapshot.image.width - this.shape_size.w, 0, this.shape_size.w, this.shape_size.h);

			this.setShapeListeners({
				q4: shp1,
				q3: shp2,
				q2: shp3,
				q1: shp4
			});

			this.handler_container.addChild(shp1, shp2, shp3, shp4);

			this.stage.addChild(this.handler_container);

		},

		print: function () {

			this.el_my_result.innerHTML = "<h1>image result:</h1><img src='" + this.stage.canvas.toDataURL("image/png") + "' alt='from canvas'/>";

		},

		downloadImg: function () {

			/* FOR IE etc
		    var newWindow = window.open("","Test","width=300,height=300,scrollbars=1,resizable=1")

			var img = this.stage.canvas.toDataURL("image/jpeg");

			newWindow.document.write('<img src="' + img + '"/>');
			*/

			var link = document.createElement('a');

			link.style.display = 'none';
			link.href = this.stage.canvas.toDataURL("image/jpeg");
			link.download = 'my-image-download.jpg';

			document.body.appendChild(link);

			link.click();

			setTimeout(function () {
				link.parentNode.removeChild(link);
			}, 10);

		},

		calcScalePercentage: function (obj) {

			var p,
				cW = (this.snapshot.image.width / 2)
				cH = (this.snapshot.image.height / 2);

			// boundaries
			if (Math.abs(obj.y) >= cH || Math.abs(obj.x) >= cW) {
				return false;
			}

			if (obj.key === 'q4' || obj.key === 'q3') {

					p = (obj.x / cW);
					diff = (1 - p);

				this.snapshot.setTransform(obj.x, obj.y, diff, diff);

				// todo: calculate rotation (the formula follows)
				// this.snapshot.setTransform(obj.x + (cW * diff), obj.y + (cH * diff), diff, diff, diff * 360, 0, 0, cW, cH);

			} else if (obj.key === 'q2' || obj.key === 'q1') {

				p = (obj.x / cW);
				diff = (1 + p);

				this.snapshot.setTransform(obj.x * -1, obj.y * -1, diff, diff);

			}

		},

		winResizeHandler: function () {

			this.myCanvas.style.width = window.innerWidth + 'px';
			this.myCanvas.style.height = window.innerWidth / (16/9) + 'px';
			this.stage.canvas.width = parseInt(this.myCanvas.style.width);
			this.stage.canvas.height = parseInt(this.myCanvas.style.height);
			this.ratio = this.stage.canvas.width / this.stage.canvas.height;

			this.myCamera.style.width = this.myCanvas.style.width;
			this.myCamera.style.height = this.myCanvas.style.height;

			if (!this.videoStream) {
				this.videoStream = this.myCamera.querySelector('video');
			}

			this.videoStream.style.width = this.myCanvas.style.width;
			this.videoStream.style.height = this.myCanvas.style.height;

			this.maskImage.scaleX = parseInt(this.myCanvas.style.width) / this.maskImage.image.width;
			this.maskImage.scaleY = parseInt(this.myCanvas.style.height) / this.maskImage.image.height;

			this.stage.update();

		}

	};

	var canvasImageSnapper = new CanvasImageSnapper();

})(window);
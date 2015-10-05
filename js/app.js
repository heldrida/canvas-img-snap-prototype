(function(window, undefined) {

	function CanvasImageSnapper() {

		this.init();

	}

	CanvasImageSnapper.prototype = {

		init: function () {

			this.setVars();
			this.detectUserMedia();
			this.setListeners();

		},

		setVars: function () {

			createjs.Ticker.timingMode = createjs.Ticker.RAF;

			this.myCanvas = document.querySelector('#myCanvas');
			this.myCanvas.style.width = window.innerWidth + 'px';
			this.myCanvas.style.height = window.innerWidth / (16/9) + 'px';
			this.moduleContainer = document.querySelector('.p-canvas-webcam-prototype');
			this.moduleContainer.style.width = window.innerWidth + 'px';
			this.moduleContainer.style.height = window.innerWidth / (16/9) + 'px';
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
			this.dragBox.alpha = 0.01; // hit area needs to be at least `0.01`, but leaving almost transparent to see through
			this.stage.addChild(this.dragBox);

			this.btnPrint = document.querySelector('.btn-print');

			this.snapshot = null;
			this.shape_size = { w: 10, h: 10 };
			this.maskImage;

			this.btnDownload = document.querySelector('.btn-download');

			this.shapes;

			// initially was 16:9 but unfortunatelly Firefox at this point
			// does not support HD and it's strict to 4:3, which is annoying
			// initially was a wide 16:9, resizing through distortion, so
			// full responsiveness as wide as the topbox
			// but this does not play well on Firefox atm, which is annoying
			this.webCamMaxWidth = 640;
			this.webCamMaxHeight = 480;
			this.webCamSizeRatio = 4 / 3;

			this.snapshots = [];

			this.el_remove_snapshot = document.querySelector('.remove_snapshot');

			this.galleryThemes = document.querySelectorAll('.gallery-selector ul li');

			// initial mask name
			this.maskName = 'mask_01';

			// cache images
			this.cached = {
				images: {}
			};

			// preload
			var arrImgList = ['img/mask_01.png', 'img/mask_02.png', 'img/mask_03.png'],
				loaded = 0;

			for (var i = 0; i < arrImgList.length; i++) {

				var img = new Image();

				img.addEventListener('load', function () {

					loaded = loaded + 1;

					if (loaded === Object.keys(this.cached.images).length) {
						this.placeMask(this.setWebcam.bind(this));
					}

				}.bind(this));

				img.src = arrImgList[i];
				this.cached.images['mask_0' + (i + 1)] = new createjs.Bitmap(img);
			}

			// mandrill api key
			this.mandrillApiKey = 'nHH-2zTVBPBY35vglYN1jg';

			this.form = document.querySelector('form[name="email"]');

		},

		setListeners: function () {

			// disable to improve performance
			if (window.navigator.userAgent.toLocaleLowerCase().indexOf('firefox')) {
				createjs.Ticker.addEventListener("tick", this.tickHandler.bind(this));
			}

			this.el_take_snapshot.addEventListener('click', this.snapHandler.bind(this));

			this.dragBox.addEventListener("mousedown", function (event) {

				if (!window.Webcam.userMedia) {
					return;
				}

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
				this.hideHandlers();
				this.downloadImg();
			}.bind(this));

			window.addEventListener('showHandlers', function () {

				this.handler_container.alpha = 1;

				this.stage.update();

			}.bind(this));

			Webcam.on('load', function () {

				this.camFitToScale();

			}.bind(this));

			this.el_remove_snapshot.addEventListener('click', function () {
				this.removeShapshotHandler.call(this);
			}.bind(this));

			var context = this;
			for (var i = 0; i < this.galleryThemes.length; i++) {
				this.galleryThemes[i].addEventListener('click', function () {

					// clear existing
					if (context.maskImage) {
						context.stage.removeChild(context.maskImage);
						context.stage.update();
					}

					context.maskName = this.getAttribute('data-mask-name');

					context.placeMask.call(context, false);

				});
			}

			window.addEventListener('submit', this.formHandler.bind(this));

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

			if (window.Webcam.userMedia) {
				Webcam.set({
					width: this.webCamMaxWidth,
					height: this.webCamMaxWidth / this.webCamSizeRatio,
					dest_width: this.webCamMaxWidth,
					dest_height: this.webCamMaxWidth / this.webCamSizeRatio,
					image_format: 'png',
					flip_horiz: true
				});
			} else {
				Webcam.set({
					width: window.innerWidth,
					height: window.innerWidth / (16 / 9),
					dest_width: window.innerWidth,
					dest_height: window.innerWidth / (16 / 9),
					image_format: 'png',
					flip_horiz: true
				});
			}

			Webcam.attach(this.myCamera);

		},

		placeImageToCanvas: function (data_uri) {

			this.snapshot = new createjs.Bitmap(data_uri);

			if (window.Webcam.userMedia) {

				var scaleFactor = parseInt(this.myCanvas.style.height) / this.webCamMaxHeight;

				this.snapshot.scaleX = scaleFactor;
				this.snapshot.scaleY = scaleFactor;

				// position center
				this.snapshot.x = (parseInt(this.myCanvas.style.width) - (this.webCamMaxWidth * scaleFactor)) / 2;

			}

			this.container.addChild(this.snapshot);

			this.stage.addChild(this.container);

			this.stage.update();

			// push to collection
			this.snapshots.push(this.snapshot);

		},

		placeMask: function (callback) {

			this.maskImage = this.cached.images[this.maskName];

			this.maskImage.scaleX = parseInt(this.myCanvas.style.width) / this.maskImage.image.width;
			this.maskImage.scaleY = parseInt(this.myCanvas.style.height) / this.maskImage.image.height;

			this.stage.addChild(this.maskImage);

			this.stage.update();

			if (typeof callback === "function") {

				callback.call(this);

			}

		},

		placeResizeHandlers: function () {

			var scaleFactor = parseInt(this.myCanvas.style.width) / this.webCamMaxWidth,
				shp1 = new createjs.Shape(), // q4
				shp2 = new createjs.Shape(), // q3
				shp3 = new createjs.Shape(), // q1
				shp4 = new createjs.Shape(), // q2
				offset = 100;

			// to reference elsewhere
			this.shapes = [shp1, shp2, shp3, shp4];

			// offset value is applied, so elements are not positioned in the corners
			shp1.graphics.beginFill("#FFFFFF").drawRect(offset, offset, this.shape_size.w, this.shape_size.h);
			shp2.graphics.beginFill("#FFFFFF").drawRect(offset, ((this.snapshot.image.height * scaleFactor) - offset) - this.shape_size.h, this.shape_size.w, this.shape_size.h);
			shp3.graphics.beginFill("#FFFFFF").drawRect(((this.snapshot.image.width * scaleFactor) - offset) - this.shape_size.w, ((this.snapshot.image.height * scaleFactor) - offset) - this.shape_size.h, this.shape_size.w, this.shape_size.h);
			shp4.graphics.beginFill("#FFFFFF").drawRect(((this.snapshot.image.width * scaleFactor) - offset) - this.shape_size.w, offset, this.shape_size.w, this.shape_size.h);

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

			var xhr = new XMLHttpRequest();
			xhr.open('POST', 'process_image.php', true);
			xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

			xhr.onload = function () {
			    // do something to response
				window.location.href = "download.php?file=" + this.responseText;

				// trigger `show handlers`
				var event = document.createEvent('Event');
				event.initEvent('showHandlers', true, true);
				window.dispatchEvent(event);

			};

			xhr.send('image=' + this.stage.canvas.toDataURL("image/png"));

		},

		calcScalePercentage: function (obj) {

			var scaleFactor = parseInt(this.myCanvas.style.width) / this.webCamMaxWidth;

			var p,
				cW = (this.snapshot.image.width / 2)
				cH = (this.snapshot.image.height / 2);

			// boundaries
			if (Math.abs(obj.y) >= cH || Math.abs(obj.x) >= cW) {
				return false;
			}

			if (obj.key === 'q4' || obj.key === 'q3') {

					p = (obj.x / cW);
					diff = (1 - p) * scaleFactor;

				this.snapshot.setTransform(obj.x * scaleFactor, obj.y * scaleFactor, diff, diff);

				// todo: calculate rotation (the formula follows)
				// this.snapshot.setTransform(obj.x + (cW * diff), obj.y + (cH * diff), diff, diff, diff * 360, 0, 0, cW, cH);

			} else if (obj.key === 'q2' || obj.key === 'q1') {

				p = (obj.x / cW);
				diff = (1 + p) * scaleFactor;

				this.snapshot.setTransform((obj.x * scaleFactor) * -1, (obj.y * scaleFactor) * -1, diff, diff);

			}

		},

		winResizeHandler: function () {

			this.myCanvas.style.width = window.innerWidth + 'px';
			this.myCanvas.style.height = window.innerWidth / (16/9) + 'px';
			this.stage.canvas.width = parseInt(this.myCanvas.style.width);
			this.stage.canvas.height = parseInt(this.myCanvas.style.height);
			this.ratio = this.stage.canvas.width / this.stage.canvas.height;

			this.moduleContainer.style.width = window.innerWidth + 'px';
			this.moduleContainer.style.height = window.innerWidth / (16/9) + 'px';

			this.camFitToScale();

			if (this.maskImage) {
				this.maskImage.scaleX = parseInt(this.myCanvas.style.width) / this.maskImage.image.width;
				this.maskImage.scaleY = parseInt(this.myCanvas.style.height) / this.maskImage.image.height;
			}

			this.stage.update();

		},

		hideHandlers: function () {

			this.handler_container.alpha = 0;

			this.stage.update();

			// todo: put it back after `download`
			// see event listeners, as this is triggered from the download callback

		},

		camFitToScale: function () {

			if (!window.Webcam.userMedia) {
				return this.camFitToScaleFlashFallback();
			}

			this.myCamera.style.width = window.innerWidth + 'px';
			this.myCamera.style.height = window.innerWidth / (16 / 9)  + 'px';

			if (!this.videoStream) {
				this.videoStream = this.myCamera.querySelector('video');
			}

			this.videoStream.style.width = window.innerWidth + 'px';
			this.videoStream.style.height = window.innerWidth / (16 / 9)  + 'px';

		},

		camFitToScaleFlashFallback: function () {

			this.myCamera.style.width = window.innerWidth + 'px';
			this.myCamera.style.height = window.innerWidth / (16 / 9)  + 'px';

			this.myCamera.querySelector('object').setAttribute('width', window.innerWidth + 'px');
			this.myCamera.querySelector('object').setAttribute('height', window.innerWidth / (16 / 9)  + 'px');

			if (window.Webcam.live) {
				window.Webcam.reset();
				this.detectUserMedia();
				Webcam.set({
					width: window.innerWidth,
					height: window.innerWidth / (16 / 9),
					dest_width: window.innerWidth,
					dest_height: window.innerWidth / (16 / 9),
					image_format: 'png',
					flip_horiz: true
				});
				Webcam.attach(this.myCamera);
			}

		},

		snapHandler: function () {

			Webcam.snap( function (data_uri) {

				this.clearSnapshotsOnStage.call(this);

				this.placeImageToCanvas.call(this, data_uri);

				// this.placeMask.call(this, this.placeResizeHandlers);
				this.placeMask.call(this, false); // disabled the handlers

				this.moduleContainer.classList.add('snapshot-on-stage');

			}.bind(this));

		},

		clearSnapshotsOnStage: function () {

			for (var i = 0; i < this.snapshots.length; i++) {

				this.container.removeChild(this.snapshots[i]);

			}

			this.handler_container.removeAllChildren();
			this.stage.update();

		},

		removeShapshotHandler: function () {

			this.moduleContainer.classList.remove('snapshot-on-stage');
			this.container.removeAllChildren();
			this.handler_container.removeAllChildren();
			this.stage.removeChild(this.maskImage);
			this.stage.update();

			this.placeMask();
		},

		sendEmail: function (params){

			// hide the handlers while taking a shot
			this.hideHandlers();

			var context = this,

			image_attachment = this.stage.canvas.toDataURL("image/png").split('base64,')[1],

			 	data = {
					'key': this.mandrillApiKey,
					'message': {
						'from_email': 'helder@lamoulade.com',
						'to': [{
							'email': params.email,
							'name': params.fullname,
							'type': 'to'
							}],
						'subject': params.subject,
						'html': params.html,
						'attachments': [{
							'type': 'image/jpeg',
							'name': '9sdhjoi3nn0sdnbonZkfk3ewdsxzX.jpeg',
							'content': image_attachment
						}]
					}
				},

				url = 'https://mandrillapp.com/api/1.0/messages/send.json',

				// construct an HTTP request
				xhr = new XMLHttpRequest();

			console.log(data);

			xhr.open('POST', url, true);

			xhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');

			// send the collected data as JSON
			xhr.send(JSON.stringify(data));

			xhr.addEventListener("load", function (res) {

				console.log('email xhr load event!');
				console.log(res);

				// trigger `show handlers`
				var event = document.createEvent('Event');
				event.initEvent('showHandlers', true, true);
				window.dispatchEvent(event);

			});

			xhr.addEventListener('readystatechange', function() {

				if (this.readyState == 4 && this.status == 200) {

					var response = this.responseText;


					context.submitSuccessHandler.call(context, response);

				}

			});

			xhr.addEventListener("error", function (res) {
				console.log('xhr error!');
			});

		},

		formHandler: function (e) {

			e.preventDefault();

			// todo: validation
			this.sendEmail({
				fullname: this.form.elements['fullname'].value,
				email: this.form.elements['email'].value,
				subject: 'Photo snap prototype test email',
				html: '<h3>Photo snap prototype: Test email</h3><p>Lorem ipsum doloriam opus copuscapolis, ladrusa madragolium su tarac patramautia, nucula scopra tramonsta escura.</p>'
			});

		},

		submitSuccessHandler: function (res) {

			console.log('submitSuccessHandler');

			var delay = 3000;

			// show success message temporarely, then remove snapshot
			this.moduleContainer.classList.add('form-success');

			// remove handlers while
			this.handler_container.removeAllChildren();

			this.stage.update.call(this);

			setTimeout(function () {

				this.moduleContainer.classList.remove('form-success');

				this.removeShapshotHandler.call(this);

				this.stage.update.call(this);

			}.bind(this), delay);

		},

		detectUserMedia: function () {

			var context = this;

			// if flash fallback, check for state change
			function checkFlashFallbackStateLooper() {

				setTimeout(function () {

					if (typeof window.Webcam !== "undefined") {

						if (window.Webcam.live) {

							// set the camera back to original position
							context.myCamera.style.zIndex = '';
							context.myCanvas.style.opacity = '';

						} else {

							// recursive loop
							checkFlashFallbackStateLooper();

						}

					} else {

						// recursive loop
						checkFlashFallbackStateLooper();

					}

				}, 300);

			}

			// if no getUSerMedia, display the camera layer on top
			// of the canvas, so that the `flash player popup` displays
			if (!window.Webcam.userMedia) {

				// place the camera container to top position
				this.myCamera.style.zIndex = 999;
				this.myCanvas.style.opacity = 0;
				checkFlashFallbackStateLooper();

			}

		}

	};

	var canvasImageSnapper = new CanvasImageSnapper();

	window.canvasImageSnapper = canvasImageSnapper;

})(window);
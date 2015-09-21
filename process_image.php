<?php

	// make sure the image-data exists and is not empty
	if ( isset($_POST["image"]) && !empty($_POST["image"]) ) {

		$path = 'results';
		$data = $_POST['image'];
		$file = md5(uniqid()) . '.png';

		// remove "data:image/png;base64,"
		$data = str_replace('data:image/png;base64,', '', $data);
		$data = str_replace(' ', '+', $data);

		// save to file
		file_put_contents($path . '/' . $file, base64_decode($data));

		// return the filename
		echo json_encode($file);

	}
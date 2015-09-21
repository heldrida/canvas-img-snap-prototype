<?php


	$file = $_GET["file"];
	$file = str_replace('"', '', $file);
	$path = dirname(__FILE__) . '/results';
	$filename = $path . '/' . $file;

	// force user to download the image
	if (file_exists($filename)) {

		header("Content-Description: File Transfer");
		header("Content-Type: application/octet-stream");
		header('Content-Disposition: attachment; filename="' . basename($filename) . '"');
		readfile($filename);
		exit;

	} else {

		echo "$filename not found";

	}
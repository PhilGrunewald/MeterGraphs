<!DOCTYPE html>
<html lan="en">
<head>
  <meta charset="utf-8">
  <title>METER - Energy-use.org</title>
  <link rel="stylesheet" type="text/css" href="../css/bootstrap.min.css">
  <link rel="stylesheet" type="text/css" href="../css/meter.css">
  <?php include('../libs/libs.php'); ?>
  <meta property="og:url"           content="http://www.energy-use.org/gallery/" />
  <meta property="og:type"          content="website" />
  <meta property="og:title"         content="Learn about your electricity use" />
  <meta property="og:description"   content="Oxford study helps us understand what we need electricity for" />
  <meta property="og:image"         content="http://www.energy-use.org/img/hh_graph.png" />
</head>
<body>
 <div id="fb-root"></div>
<script>
(function(d, s, id) {
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) return;
  js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_GB/sdk.js#xfbml=1&version=v2.9";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
</script> 

<?php
	include('../_nav_bar_subfolder.php');
	include('../db.php');
	$db = mysqli_connect($server,$dbUserName,$dbUserPass,$dbName);

	//Option A. Set id by adding '?id=X' (without the 'random') in the address bar
	//Option B. Get random id by pressing the random button
	//Option C. Revert to default activities id by just the clean .php in the address bar
	//note: when random is pressed, get a random id. It can be found by typing 'id' in the console. It will *not* be the same as the id shown in the address bar

	$id = 3217; //default activities id

	//check if random button is pressed, it ignores any id that might be set in the address bar 
	if (isset($_GET['id'])) { 
		$id = $_GET['id']; 
	}
	if (isset($_GET['random'])) {
		$random = $_GET['random'];
		if ($random == 1) {
	   		$sqlq = "Select idMeta AS id 
			FROM Meta 
			WHERE Quality > 0
			AND DataType = 'A'
			ORDER BY RAND() 
			LIMIT 1;";

		   	if ($q = mysqli_query($db,$sqlq)) {
		        $f = mysqli_fetch_assoc($q);
		        $id   = $f['id'];
		    } 
		}
	}
 	echo '<script>var id = "'.$id.'";</script>';
?>

<div class="container">
 <div class="row">
  <div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2" id = "canvas_col" style="background-color: transparent;">

<h3>Your Enjoyment</h3>
<form>
	<input type="hidden" name="id" value="<?php echo $id; ?>">
	<button name="random" value="1" class="btn btn-round btn-success" action="galery.php">Random</button> 
</form>
	<div id="canvas"></div>
	<div class='tooltip'></div>
	</br>


<div class="fb-share-button" data-href="http://www.energy-use.org/gallery" data-layout="button" data-size="large" data-mobile-iframe="true"><a class="fb-xfbml-parse-ignore" target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Fwww.energy-use.org%2Fgallery&amp;src=sdkpreparse">Invite friends</a></div>

  </div> <!-- col -->
 </div> <!-- row -->

  <a href="../gallery"> 
    <div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2 rounded-box">
            <p class="center"><b>Return to Meter Gallery</b></p> 
    </div>
  </a>


<script type="text/javascript" src="../D3/your_enjoyment.js"></script>

</div> <!-- cont -->
</body>
</html>

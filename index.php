<!DOCTYPE html>
<html lan="en">
<head>
  <meta charset="utf-8">
  <title>METER - Energy-use.org</title>
  <link rel="stylesheet" type="text/css" href="libs/bootstrap.min.css">
  <link rel="stylesheet" type="text/css" href="meter.css">
  <script src="libs/d3.v3.js"></script>
	<script src="libs/lodash.js"></script>
  <script src="libs/jquery-2.2.1.min.js"></script>
  <script src="libs/bootstrap.min.js"></script>

</head>
<body>
  <?php
    $id='7936';
    if(isset($_GET['id'])){ $id = $_GET['id']; }
    echo '<script>var hhid = "'.$id.'";</script>';
	include('_nav_bar_yourdata.php');
  ?>
<div class="container">
 <div class="row">
  <div class="col-xs-12 col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2" style="background-color: transparent;">

  <h3>Your electricity profile</h3>
  <div id="canvas"></div>
  <div class='tooltip'></div>

  <script type="text/javascript" src="meter.js"></script>

  <!-- Modal for Users -->
  <div class="modal fade" id="modalActivity" tabindex="-1" role="dialog" aria-labelledby="modalLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">

        <!-- Modal Header -->
        <div class="modal-header">
          <button type="button" class="close" data-dismiss="modal">
            <span aria-hidden="true">&times;</span>
            <span class="sr-only">Close</span>
          </button>
          <h3 class="modal-title" id="modalLabel">Activity</h3>
        </div>

        <!-- Modal Body -->
        <div class="modal-body">
            <form id="formEditActivity" action="editactivity"
                  class="form-horizontal" role="form" method="post">
              <input type="hidden" name="id" id="id">
              <div class="form-group">
                <label class="col-sm-3 control-label" for="timestamp">Time</label>
                <div class="col-sm-6">
                    <input type="text" class="form-control" id="timestamp" name="timestamp"/></div></div>
              <div class="form-group">
                <label class="col-sm-3 control-label" for="activity">Activity</label>
                <div class="col-sm-6">
                    <input type="text" class="form-control" id="activity" name="activity"/></div></div>
              <div class="form-group">
                <label class="col-sm-3 control-label" for="location">Location</label>
                <div class="col-sm-6">
                    <input type="text" class="form-control" id="location" name="location"/></div></div>

              <div class="form-group">
                <label class="col-sm-3 control-label" for="enjoyment">Enjoyment</label>
                <div class="col-sm-6">
                    <input type="radio" name="enjoyment" id="enjoyment_1" value="1"> <img src=img/enjoy_1.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_2" value="2"> <img src=img/enjoy_2.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_3" value="3"> <img src=img/enjoy_3.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_4" value="4"> <img src=img/enjoy_4.png width='20px' height='20px'>
                    <input type="radio" name="enjoyment" id="enjoyment_5" value="5"> <img src=img/enjoy_1.png width='20px' height='20px'><br></div></div>

              </form>
          <div id='errormsg'></div>
        </div>
              
        <!-- Modal Footer -->
        <div class="modal-footer">
            <button type="button" class="btn btn-danger" data-dismiss="modal"> Cancel </button>
            <button type="button" id="submitActivity" class="btn btn-primary"> Submit Activity </button>
        </div>
      </div>
    </div>
  </div>
</div> 
</div> 
</div> 
</body>
</html>

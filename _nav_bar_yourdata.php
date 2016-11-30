
<?php $url = $_SERVER['REQUEST_URI']; ?>

	<div class="container" > <!-- Static navbar -->
		<nav class="navbar navbar-default" style="background: rgba(255, 255, 255, 0.6);">
			<div class="container-fluid" >
				<div class="navbar-header" >
					<button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#navbar" aria-expanded="false" aria-controls="navbar">
						<span class="sr-only">Toggle navigation</span>
						<span class="icon-bar"></span>
						<span class="icon-bar"></span>
						<span class="icon-bar"></span>
					</button>
					<a class="navbar-brand" href="index.php">
						<img class="img-responsive" src="../img/meter_logo_trans.png" alt="METER" width="120" />
					</a>
				</div>
				<div id="navbar" class="navbar-collapse collapse">
					<ul class="nav navbar-nav" style="background: rgba(255, 255, 255, 0.6);">
						<li class="dropdown <?php if (strpos($url,'about') !== false) {echo 'active';} ?>">
							<a href="../about.php" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">About<span class="caret"></span></a>
							<ul class="dropdown-menu">
								<li><a href="../about.php">About Meter</a></li>
								<li><a href="../about.php#team">Meet the team</a></li>
								<li><a href="../about.php#partners">Our Partners</a></li>
							</ul>
						</li>

						<li class="dropdown <?php if (strpos($url,'how') !== false) {echo 'active';} ?>">
							<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">For participants<span class="caret"></span></a>
							<ul class="dropdown-menu">
								<li><a href="../how_it_works.php">How METER works</a></li>
								<li><a href="../hhq.php">Household survey</a></li>
								<li><a href="../data_policy.php">Data privacy and ethics</a></li>
								<li role="separator" class="divider"></li>
								<li><a href="../contact.php">Contact</a></li>
								<li><a href="../contact.php">Ask a question</a></li>
							</ul>
						</li>
						<li class="dropdown <?php if (strpos($url,'research') !== false) {echo 'active';} ?>">
							<a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Research<span class="caret"></span></a>
							<ul class="dropdown-menu">
								<li><a href="../background.php">Background</a></li>
								<li><a href="../research.php">Blog</a></li>
								<li role="separator" class="divider"></li>
								<li><a href="https://oxford.academia.edu/PhilippGr%C3%BCnewald">Publications</a></li>
								<li><a href="https://www.linkedin.com/in/philipp-gruenewald-32ba561b">LinkedIn</a></li>
							</ul>
					    	</li>
					        <li class="dropdown <?php if (strpos($url,'resources') !== false) {echo 'active';} ?>">
					        	<a href="resources.php" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Resources<span class="caret"></span></a>
					        	<ul class="dropdown-menu">
					        		<li><a href="../updates.php">Updates</a></li>
					        		<li><a href="../resources.php">Documents</a></li>
					        		<li><a href="../resources.php#slides">Slides</a></li>
					        		<li role="separator" class="divider">External pages</li>
					        		<li><a href="https://github.com/PhilGrunewald/MeterApp">App development</a></li>
					        		<li><a href="https://github.com/PhilGrunewald">GitHub</a></li>
					        	</ul>
					        </li>
				</ul>
				<ul class="nav navbar-nav navbar-right">
					<li><a href="../navbar-fixed-top/"></a>


					</li>
				</ul>
				<br/>
				<a href="http://www.eci.ox.ac.uk">
				<img class="img-responsive pull-right" src="../img/eci-logo-colour.png" alt="METER" width="140" />
				</a>
				<br/>
			</div><!--/.nav-collapse -->
		</div><!--/.container-fluid -->
		</nav>
	</div> <!-- /container -->

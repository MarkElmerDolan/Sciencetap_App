var app = angular.module('ionicApp', ['ionic', 'ui.router', 'ngMap'])

app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider){
	$stateProvider
		.state('login',{
			url: '/login',
			templateUrl: 'templates/login.html',
			controller: 'SciencetapCtrl'
		})
		.state('settings',{
			url: '/settings',
			templateUrl: 'templates/settings.html',
			controller: 'SciencetapCtrl'
		})
		.state('setPassword',{
			url: '/setPassword',
			templateUrl: 'templates/setPassword.html',
			controller: 'SciencetapCtrl'
		})
		.state('map',{
			url: '/map',
			templateUrl: 'templates/map.html',
			controller: 'SciencetapCtrl'
		})
		.state('collect',{
			url: '/collect',
			templateUrl: 'templates/collect.html',
			controller: 'SciencetapCtrl'
		})
		.state('view',{
			url: '/view',
			templateUrl: 'templates/view.html',
			controller: 'SciencetapCtrl'
		})
	$urlRouterProvider.otherwise('/login')
})

app.run(function($ionicPlatform, $state) {
	
	setTimeout(function(){
		navigator.splashscreen.hide();
	}, 1000);

	$ionicPlatform.ready(function() {
		if(window.cordova && window.cordova.plugins.Keyboard) {
		     cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}
		if(window.StatusBar) {
		     StatusBar.styleDefault();
		}
		var loggedInUser = window.localStorage.getItem('loggedInUser');
		if(loggedInUser != null){
			$state.go('settings');	
		}
	});
})

app.controller('SciencetapCtrl', function($scope, $ionicPopup, $state, $ionicLoading, $compile, $ionicModal, $ionicHistory, $http, $ionicSlideBoxDelegate, Camera, SciencetapService, LoginService){
	$scope.data = {};
	$scope.loginDisabled = false;
	$scope.login = function(){
		LoginService.loginUser($scope.data.username, $scope.data.password, $scope.projects).success(function(data){
			$scope.loginDisabled = true;
			var request = $http({
			    method: "post",
			    url: 'http://sciencetap.us/ionic/login.php',
			    data:{
				emailLogin: $scope.data.username,
				passLogin: $scope.data.password
			    }
			});
			request.success(function(data){
				if (data.Status == 'Success'){
					window.localStorage.setItem("userId", data.userId);
					window.localStorage.setItem("firstName", data.firstName);
					window.localStorage.setItem("lastName", data.lastName);
					window.localStorage.setItem("email", data.email);
					window.localStorage.setItem("phone", data.phone);
					if(data.superAdmin === undefined){
						if(data.projectAdmin === undefined){
							window.localStorage.setItem("role", 'projectUser');
						}else{
							window.localStorage.setItem("role", 'projectAdmin');
						}	
					}else{
						window.localStorage.setItem("role", 'superAdmin');
					}
					if(data.Message === undefined){
						window.localStorage.setItem("message", '');
					}else{
						window.localStorage.setItem("message", data.Message);
					}
					window.localStorage.setItem('loggedInUser', true);
					for(var i = 0; i < data.projects.length; i++){
						$scope.projects.push(
						{
						    name: data.projects[i].name,
						    id: data.projects[i].id
						}
						);
					}
					$state.go('settings');
				}else{
					window.localStorage.removeItem('loggedInUser');
					var alertPopup = $ionicPopup.alert({
					    title: 'Login failed',
					    template: 'Please check your credentials'
					});
					$scope.loginDisabled = false;
				}
			});
		}).error(function(data){
			var alertPopup = $ionicPopup.alert({
			    title: 'Login failed',
			    template: 'Please check your credentials'
			});
		});
	}
	$scope.user = {};
	$scope.user.firstName = window.localStorage.getItem("firstName");
	$scope.user.role = window.localStorage.getItem("role");
	$scope.user.email = window.localStorage.getItem("email");
	$scope.user.phone = window.localStorage.getItem("phone");
	$scope.user.id = window.localStorage.getItem("userId");
	$scope.user.lastName = window.localStorage.getItem("lastName");
	$scope.message = window.localStorage.getItem("message");

	$scope.projects = [];
	$scope.sites = [];
	$scope.forms = [];
	$scope.form_inputs= [];
	$scope.formSelected = false;
	$scope.dropdowns = [];
	$scope.observations = [];
	$scope.data = [];
	$scope.images = [];
	$scope.observationObjects = [{
		projectName : 'None',
		siteName : 'None',
		formName : 'None'
	}];

$scope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){
	console.log(toState);
	console.log(fromState);
	window.localStorage.setItem("toState", toState.url);
});
	$scope.toState = window.localStorage.getItem("toState");
	if($scope.toState != null && $scope.toState == "/collect"){
		var request = $http({
		    method: "post",
		    url: 'http://sciencetap.us/ionic/getCollectData.php',
		    data:{
			userId: $scope.user.id
		    }
		});
		request.success(function(data){
			console.log(data);
			if (data.Status == 'Success'){
				for(var i = 0; i < data.projects.length; i++){
					$scope.projects.push(
					{
					    name: data.projects[i].name,
					    id: data.projects[i].id
					}
					);
				}
				for(var i = 0; i < data.sites.length; i++){
					$scope.sites.push(
					{
					    site_name: data.sites[i].site_name,
					    site_id: data.sites[i].site_id,
					    project_id: data.sites[i].project_id
					}
					);
				}
				for(var i = 0; i < data.forms.length; i++){
					$scope.forms.push(
					{
						name:  data.forms[i].form_name,
						id: data.forms[i].form_id,
						description: data.forms[i].form_description,
						project_id: data.forms[i].project_id,
						fields: []
					}
					);
				}
				for(i = 0; i < data.form_inputs.length; i++){
					$scope.form_inputs.push(
					{
					    name: data.form_inputs[i].form_input_name,
					    fieldID: data.form_inputs[i].form_input_id,
					    formID: data.form_inputs[i].form_id,
						input: '',
						form_input_type: data.form_inputs[i].form_input_type
					}
					);
				}
				for(i = 0; i < $scope.form_inputs.length; i++){
				    for(var j = 0; j < $scope.forms.length; j++){
					if($scope.forms[j].id == $scope.form_inputs[i].formID){
					    $scope.forms[j].fields.push($scope.form_inputs[i]);
					}
				    }
				}
				for(i = 0; i < data.dropdowns.length; i++){
					$scope.dropdowns.push(
					{
					    dropdown_value: data.dropdowns[i].dropdown_value,
					    form_input_id: data.dropdowns[i].form_input_id
					}
					);
				}
			
			}
		});
	}
	if($scope.toState != null && $scope.toState == "/view"){
		var request = $http({
		    method: "post",
		    url: 'http://sciencetap.us/ionic/getViewData.php',
		    data:{
			userId: $scope.user.id
		    }
		});
		request.success(function(data){
			console.log(data);
			if (data.Status == 'Success'){
				for(var i = 0; i < data.projects.length; i++){
					$scope.projects.push(
					{
					    name: data.projects[i].name,
					    id: data.projects[i].id
					}
					);
				}
				for(var i = 0; i < data.sites.length; i++){
					$scope.sites.push(
					{
					    site_name: data.sites[i].site_name,
					    site_id: data.sites[i].site_id,
					    project_id: data.sites[i].project_id
					}
					);
				}
				for(var i = 0; i < data.forms.length; i++){
					$scope.forms.push(
					{
						name:  data.forms[i].form_name,
						id: data.forms[i].form_id,
						description: data.forms[i].form_description,
						project_id: data.forms[i].project_id,
						fields: []
					}
					);
				}
				for(i = 0; i < data.form_inputs.length; i++){
					$scope.form_inputs.push(
					{
					    name: data.form_inputs[i].form_input_name,
					    fieldID: data.form_inputs[i].form_input_id,
					    formID: data.form_inputs[i].form_id,
						input: '',
						form_input_type: data.form_inputs[i].form_input_type
					}
					);
				}
				for(i = 0; i < $scope.form_inputs.length; i++){
				    for(var j = 0; j < $scope.forms.length; j++){
					if($scope.forms[j].id == $scope.form_inputs[i].formID){
					    $scope.forms[j].fields.push($scope.form_inputs[i]);
					}
				    }
				}
				for(var i = 0; i < data.observations.length; i++){
					$scope.observations.push(
					{
					    observation_id : data.observations[i].observation_id,
					    form_id : data.observations[i].form_id,
					    site_id : data.observations[i].site_id,
					    project_id : data.observations[i].project_id,
					    observation_time_created: data.observations[i].observation_time_created,
					    user_id : data.observations[i].user_id
					}
					);
				}
				for(var i = 0; i < data.data.length; i++){
					$scope.data.push(
					{
					    data_id : data.data[i].data_id,
					    form_input_id : data.data[i].form_input_id,
					    data_value : data.data[i].data_value,
					    observation_id : data.data[i].observation_id
					}
					);
				}
				for(var i = 0; i < data.images.length; i++){
					$scope.images.push(
					{
					    image_id : data.images[i].image_id,
					    link : data.images[i].link,
					    image_name: data.images[i].image_name,
					    observation_id : data.images[i].observation_id
					}
					);
				}
				buildObservationObject();
				console.log($scope.images);
				console.log($scope.data);
				console.log($scope.observations);
			}
		});
	}
	var buildObservationObject = function(){
		$scope.observationObjects = [];
		for(i = 0; i < $scope.observations.length; i++){
			var projectName = '';
			var siteName = '';
			var formName = '';
			var data = [];
			var images = [];
			var formInputs = [];
			var time = $scope.observations[i].observation_time_created;
			for(j = 0; j < $scope.projects.length; j++){
				if($scope.observations[i].project_id == $scope.projects[j].id){
					projectName = $scope.projects[j].name;
				}
			}
			for(j = 0; j < $scope.sites.length; j++){
				if($scope.observations[i].site_id == $scope.sites[j].site_id){
					siteName = $scope.sites[j].site_name;
				}
			}
			for(j = 0; j < $scope.forms.length; j++){
				if($scope.observations[i].form_id == $scope.forms[j].id){
					formName = $scope.forms[j].name;
					for(k = 0; k < $scope.form_inputs.length; k++){
						if($scope.forms[j].id == $scope.form_inputs[k].formID){
							formInputs.push($scope.form_inputs[k]);
						}
					}
				}
			}
			for(j = 0; j < $scope.data.length; j++){
				if($scope.observations[i].observation_id == $scope.data[j].observation_id){
					data.push($scope.data[j]);
				}
			}
			for(j = 0; j < $scope.images.length; j++){
				if($scope.observations[i].observation_id == $scope.images[j].observation_id){
					images.push($scope.images[j]);
				}
			}
			$scope.observationObjects.push({
				projectName : projectName,
				siteName : siteName,
				formName : formName,
				data : data,
				images : images,
				time : time,
				formInputs : formInputs
			});
		}
		console.log($scope.observationObjects);
	};
	$scope.selectedObservation = '';
	$scope.setObservationObject = function(obj){
		$scope.selectedObservation = obj;
	}
	$scope.refresh = function(){
		$scope.selectedProject = noProject; 
		$scope.selectedSite = noSite; 
		$scope.selectedForm = noForm; 
	};

	var noProject = {
		name: 'Select a Project',
		id: 0
	};

	var noSite = {
		site_name: 'Select a Site',
		site_id: 0
	};

	var noForm = {
            name:  'Select a Form (Optional)',
            id: '0',
            fields: []
	};

	var noDropdown = {
		dropdown_value: 'none',
		form_input_id: '0'
	}
		

        $scope.selectedProject = noProject; 
        $scope.selectedSite = noSite; 
        $scope.selectedForm = noForm; 
        $scope.selectedDropdown = noDropdown; 

        $scope.selectProject = function(project){
            $scope.selectedProject = project;
        }
        
        $scope.selectSite = function(site){
            $scope.selectedSite = site;
        }

	$scope.getDropdown = function(id){
		console.log(id);
		$scope.selectedDropdown = []; 
		for(i = 0; i < $scope.dropdowns.length; i++){
			if($scope.dropdowns[i].form_input_id == id){
				$scope.selectedDropdown.push($scope.dropdowns[i]);
			}
		}
		console.log($scope.selectedDropdown);
	}

	$scope.dropdownInput = function(value, id){
		console.log(value);
		console.log(id);
		for(i = 0; i < $scope.selectedForm.fields.length; i++){
			if($scope.selectedForm.fields[i].fieldID == id){
				$scope.selectedForm.fields[i].input = value;
			}
		}
		console.log($scope.selectedForm);
	}

        $scope.selectDropdown= function(dropdown){
            $scope.selectedDropdown = dropdown;
        }
            
        $scope.selectForm = function(form){
            $scope.selectedForm = form;
            $scope.formSelected = true;
            console.log($scope.selectedForm);
        }

	var noProjectSelectedPopup = function(){
		var popup = $ionicPopup.alert({
			title: 'No Project Selected',
			template: 'A project must be selected'
		});
		popup.then(function(res){
			console.log("alert popup closed");
		});
	};

	$scope.submitData = function(){
		if($scope.selectedProject.id == "0"){
			noProjectSelectedPopup();
			return;
		}
		if($scope.selectedForm.id != '0'){
			var uploadData = {
			project_id: $scope.selectedProject.id,
			site_id: $scope.selectedSite.site_id,
			user_id: $scope.user.id,
			form: $scope.selectedForm
			};
			console.log("Upload Data");
			console.log(uploadData);
			var request = $http({
			    method: "post",
			    url: 'http://sciencetap.us/ionic/uploadData.php',
			    data:{
				uploadData: uploadData 
			    }
			});
			request.success(function(data){
				$scope.observationID = data.slice(1, -1);
				if($scope.images.length > 0){
					$scope.send();
				}
			});
		}else if($scope.images.length > 0){
			var uploadData = {
				project_id: $scope.selectedProject.id,
				site_id: $scope.selectedSite.site_id,
				user_id: $scope.user.id
			};
			var request = $http({
			    method: "post",
			    url: 'http://sciencetap.us/ionic/imageObservation.php',
			    data:{
				uploadData: uploadData 
			    }
			});
			request.success(function(data){
				$scope.observationID = data.slice(1, -1);
				$scope.send();
			});
		}
	}

	$scope.password = '';
	$scope.confirmPassword = '';

	$scope.images = [];
	$scope.fileURI;
	$scope.imageName;
	$scope.showImagesItem = $scope.images.length;
	$scope.observationID = 0;

	$scope.getPhoto = function() {
		var options = {
			quality: 50,
			destinationType: navigator.camera.DestinationType.FILE_URI,
			sourceType: 1,
			encodingType: 0
		}
		Camera.getPicture(options).then(function(FILE_URI){
			console.log(FILE_URI);
			$scope.fileURI = FILE_URI;
		       $scope.openImageNameModal();
		}, function(err){
			console.log("failed" + err);
		});

	}

	$scope.send = function(){
		for(var i = 0; i < $scope.images.length; i++){
			var myImg = $scope.images[i].fileURI;
			var options = new FileUploadOptions();
			options.fileKey = "post";
			options.mimeType = "image/jpeg";
			options.chunkedMode = false;
			var params = {};
			params.imageName = $scope.images[i].imageName;
			params.project_id = $scope.selectedProject.id;
			params.site_id = $scope.selectedSite.site_id;
			params.user_id = $scope.user.id;
			params.observation_id = $scope.observationID;
			options.params = params;
			var ft = new FileTransfer();
			ft.upload(myImg, encodeURI('http://sciencetap.us/ionic/uploadImages.php'), onUploadSuccess, onUploadFail, options);
		}
	}

	var onUploadSuccess = function(r){
		console.log("Code =" + r.responseCode);
		console.log("Response = " + r.response);
		console.log("Sent = " + r.bytesSent);
	}
	var onUploadFail = function(error){
		console.log("upload error source " + error.source);
		console.log("upload error target " + error.target);
	}
    $scope.removeImage = function(){
        $scope.images.splice($ionicSlideBoxDelegate.currentIndex(),1);
        $ionicSlideBoxDelegate.update();
        $ionicSlideBoxDelegate.slide(0);
        console.log($ionicSlideBoxDelegate.currentIndex());
    }
        $scope.addData = function(num, text){
            console.log(num);
            console.log(text);
            $scope.selectedForm.fields.push(
                {
                            name: text,
                            fieldID: num,
                            formID: '-1'
                }
            );
        };

	$scope.logout = function(){
		window.localStorage.removeItem('loggedInUser');
		$state.go('login');
		$scope.closePopover();
	}

	$scope.setPassword = function(){ $state.go('setPassword'); }
	$scope.updatePassword = function(){ $state.go('settings'); }
	$scope.goBack = function(){ $ionicHistory.goBack(); }

        
               $ionicModal.fromTemplateUrl('templates/picture_slide.html', {
                       scope: $scope,
                       animation: 'slide-in-up'
                   }).then(function(modal) {
                           $scope.pictureModal = modal;
                   });
               
               $scope.openPictureModal = function() {
                   $scope.pictureModal.show();
               };
               
               $scope.closePictureModal = function() {
                   $scope.pictureModal.hide();
               };
               
               $ionicModal.fromTemplateUrl('templates/addData.html', {
                       scope: $scope,
                       animation: 'slide-in-up'
                   }).then(function(modal) {
                           $scope.addDataModal = modal;
                   });
               
               $scope.openAddDataModal = function() {
                   $scope.addDataModal.show();
               };
               
               $scope.closeAddDataModal = function() {
                   $scope.addDataModal.hide();
               };
               
               $ionicModal.fromTemplateUrl('templates/collect_form.html', {
                       scope: $scope,
                       animation: 'slide-in-up'
                   }).then(function(modal) {
                           $scope.formsModal = modal;
                   });
               
               $scope.openFormsModal = function() {
                   $scope.formsModal.show();
               };
               
               $scope.closeFormsModal = function() {
                   $scope.formsModal.hide();
               };
               
               $ionicModal.fromTemplateUrl('templates/collect_project.html', {
                       scope: $scope,
                       animation: 'slide-in-up'
                   }).then(function(modal) {
                           $scope.projectModal = modal;
                   });
               
               $scope.openProjectModal = function() {
                   $scope.projectModal.show();
               };
               
               $scope.closeProjectModal = function() {
                   $scope.projectModal.hide();
               };
               
               
               $ionicModal.fromTemplateUrl('templates/collect_site.html', {
                       scope: $scope,
                       animation: 'slide-in-up'
                   }).then(function(modal) {
                           $scope.sitesModal = modal;
                   });
               
               $scope.openSitesModal = function() {
                   $scope.sitesModal.show();
               };
               
               $scope.closeSitesModal = function() {
                   $scope.sitesModal.hide();
               };

               $ionicModal.fromTemplateUrl('templates/view_observation.html', {
                       scope: $scope,
                       animation: 'slide-in-up',
			observationObject : $scope.selectedObservation
                   }).then(function(modal) {
                           $scope.observationModal = modal;
                   });
               
               $scope.openObservationModal = function() {
                   $scope.observationModal.show();
               };
               
               $scope.closeObservationModal = function() {
                   $scope.observationModal.hide();
               };

               $ionicModal.fromTemplateUrl('templates/collect_dropdown.html', {
                       scope: $scope,
                       animation: 'slide-in-up',
			dropdowns: $scope.dropdowns 
                   }).then(function(modal) {
                           $scope.dropdownModal = modal;
                   });
               
               $scope.openDropdownModal = function() {
                   $scope.dropdownModal.show();
			console.log("firing");
               };
               
               $scope.closeDropdownModal = function() {
                   $scope.dropdownModal.hide();
               };

               $ionicModal.fromTemplateUrl('templates/collect_imageName.html', {
                       scope: $scope,
                       animation: 'slide-in-up'
                   }).then(function(modal) {
                           $scope.imageNameModal = modal;
                   });
               
               $scope.openImageNameModal = function() {
                   $scope.imageNameModal.show();
               };
               
               $scope.closeImageNameModal = function(image) {
			$scope.imageName = image.name;
			$scope.images.push({
				"fileURI" : $scope.fileURI,
				"imageName" : $scope.imageName
			});
			$scope.showImagesItem = $scope.images.length;
			$scope.imageName = '';
			$scope.fileURI = '';
			console.log("image");
			console.log(image);
			console.log("scope images");
			console.log($scope.images);
                   $scope.imageNameModal.hide();
               };
               
               //Cleanup the modal when we're done with it!
               $scope.$on('$destroy', function() {
                          $scope.sitesModal.remove();
                          $scope.projectModal.remove();
                          $scope.pictureModal.remove();
                          $scope.formsModal.remove();
                          $scope.addDataModal.remove();
                          $scope.imageNameModal.remove();
                          $scope.dropdownModal.remove();
                          $scope.observationModal.remove();
                });
               
               // Execute action on hide modal
               $scope.$on('modal.hidden', function() {
                          // Execute action
                });
               
               // Execute action on remove modal
               $scope.$on('modal.removed', function() {
                          // Execute action
              });
})

app.service('LoginService', function($q, $http, $state){
	return{ 
		loginUser: function(name, pw, projects){
			var deferred = $q.defer();
			var promise = deferred.promise;

			if(name == "" || name == null ){
				deferred.reject('Wrong credentials');
				window.localStorage.removeItem('loggedInUser');
			}else{
				deferred.resolve('Welcome ' + name + '!');
			}
			promise.success = function(fn){
				promise.then(fn);
				return promise;
			}
			promise.error = function(fn){
				promise.then(null, fn);
				return promise;
			}
			return promise;
		}
	}
})

app.factory('Camera', ['$q', function($q) {
  return {
    getPicture: function(options) {
      var q = $q.defer();
      navigator.camera.getPicture(function(result) {
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);
      return q.promise;
    },
    getGallery: function(options) {
      var q = $q.defer();
      navigator.camera.getPicture(function(result) {
        // Do any magic you need
        q.resolve(result);
      }, function(err) {
        q.reject(err);
      }, options);
      return q.promise;
    }
  }
}]);

app.controller('MapCtrl', function($scope, $state, $ionicLoading, $compile){
               
               console.log('In MapCtrl');
               
/*
	function initialize(){
 var myLatLng = new google.maps.LatLng(43.07493,-89.381388);
 
 var mapOptions = {
 center: myLatLng,
 zoom: 16,
 mapTypeId: google.maps.MapTypeId.ROADMAP
 };
 
 var map = new google.maps.Map(document.getElementById("map"), mapOptions);
 
 var contentString = "<div><a ng-click='clickTest()'>Click Me!</a></div>";
 
 var compiled = $compile(contentString)($scope);
 
 var infoWindow = new google.maps.InfoWindow({
 content: compiled[0]
 });
 
 var marker = new google.maps.Marker({
 position: myLatLng,
 map: map,
 title: 'Uluru (Ayers Rock)'
 });
 
 google.maps.event.addListener(marker, 'click', function(){
 infoWindow.open(map, marker);
 });
 
 $scope.map = map;
	}
 
	google.maps.event.addDomListener(window, 'load', initialize);
 
	$scope.centerOnMe = function(){
 if(!$scope.map){
 return;
 }
 
 $scope.loading = $ionicLoading.show({
 content: 'Getting Current Location...',
 showBackdrop: false
 });
 
 navigator.geolocation.getCurrentPosition(function(pos){
 $scope.map.setCenter(new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude));
 $scope.loading.hide();
 }, function(error){
 alert('Unable to get location: ' + error.message);
 });
	};
 
	$scope.clickTest = function(){
 alert('Example of infoWindow with ng-click');
	};
 */
               })

app.directive('compareStrings', function(){
	return{
		require: "ngModel",
		link: function(scope, element, attributes, ngModel){
				ngModel.$validators.compareTo = function(modelValue){
					return modelValue == scope.otherModelValue;
				};

				scope.$watch("otherModelValue", function(){
					ngModel.$validate();
				});

			}

	};
}); 

app.service('SciencetapService', function($q){
            console.log('In Service');
            return {
            projects: [
                       {name: 'Project 1'},
                       {name: 'Project 2'},
                       {name: 'Project 3'},
                       {name: 'Project 4'},
                       {name: 'Project 5'},
                       ],
            sites: [
                    {name: 'Site 1'},
                    {name: 'Site 2'},
                    {name: 'Site 3'},
                    {name: 'Site 4'},
                    {name: 'Site 5'},
                    ],
            getProjects: function(){
            return this.projects
            }
            }
})




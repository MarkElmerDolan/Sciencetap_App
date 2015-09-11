var app = angular.module('ionicApp', ['ionic', 'ui.router', 'ngMap'])

app.config(function($stateProvider, $urlRouterProvider, $ionicConfigProvider){
	$ionicConfigProvider.views.maxCache(0);
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
			templateUrl: 'map.html',
			controller: 'MapCtrl'
		})
		.state('collect',{
			url: '/collect',
			templateUrl: 'templates/collect.html',
			controller: 'SciencetapCtrl'
		})
		.state('view',{
			url: '/view',
			templateUrl: 'view.html',
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
					console.log(data);
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
					console.log($scope.projects);
					console.log("In login ajax");
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

        $scope.selectedProject = {
	name: 'Select a Project',
	id: 0
	 };
            
        $scope.selectedSite = {
	site_name: 'Select a Site',
	site_id: 0
	 };

        $scope.selectedForm = {
            name:  'Select a Form (Optional)',
            id: '0',
            fields: []
        };

        $scope.selectProject = function(project){
            $scope.selectedProject = project;
        }
        
        $scope.selectSite = function(site){
            $scope.selectedSite = site;
        }
            
        $scope.selectForm = function(form){
            $scope.selectedForm = form;
            $scope.formSelected = true;
            console.log($scope.selectedForm);
        }

	$scope.submitData = function(){
		var formData;
		var uploadData = {
		project_id: $scope.selectedProject.id,
		site_id: $scope.selectedSite.site_id,
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
			console.log(data);
		});
	}

	$scope.password = '';
	$scope.confirmPassword = '';

	$scope.images = [];
	$scope.showImagesItem = $scope.images.length;
    $scope.getPhoto = function() {
        Camera.getPicture().then(function(imageURI) {
          console.log(imageURI);
            $scope.images.push(imageURI);
            $scope.showImagesItem = $scope.images.length;
        }, function(err) {
          console.err(err);
        });
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
        $scope.addNum = 1;
        $scope.addText = "";
        
        var currentDate = new Date();
        
        $scope.currentTime = currentDate.toLocaleTimeString('en-US');
        console.log($scope.currentTime);
/*
	$scope.goToCollect = function(){
		console.log('In here!');
		$scope.currentTime = currentDate.toLocaleTimeString('en-US');
		navigator.geolocation.getCurrentPosition(geolocationSuccess);
		function geolocationSuccess (position) {
			$scope.currentLat = Number(position.coords.latitude.toFixed(4));
			$scope.currentLong = Number(position.coords.longitude.toFixed(4));
			$scope.$apply();
		}
                var mainRequest = $http({
			method: "post",
			url: 'http://sciencetap.us/assets/App/PHP/ionicGetData.php',
			data:{
			    userId: $scope.userId
			}
		});
		mainRequest.success(function(data){
			$scope.projects = []; $scope.sites = []; $scope.forms = []; $scope.formsFields = [];
			for(var i = 0; i < data.SiteNames.length; i++){
				$scope.sites.push(
				{
				    name: data.SiteNames[i],
				    id: data.SiteIDs[i],
				    projectID: data.Site_ProjectIDs[i]
				}
				);
			}
			for(i = 0; i < data.ProjectNames.length; i++){
				$scope.projects.push(
				{
				    name: data.ProjectNames[i],
				    id: data.ProjectIDs[i]
				}
				);
			}
			for(i = 0; i < data.FormNames.length; i++){
				$scope.forms.push(
				{
				    name: data.FormNames[i],
				    id: data.FormIDs[i],
				    fields:[]
				}
				);
			}
			for(i = 0; i < data.FieldNames.length; i++){
				$scope.formsFields.push(
				{
				    name: data.FieldNames[i],
				    fieldID: data.FieldIDs[i],
				    formID: data.FieldFormIDs[i]
				}
				);
			}
			for(i = 0; i < $scope.formsFields.length; i++){
			    for(var j = 0; j < $scope.forms.length; j++){
				if($scope.forms[j].id == $scope.formsFields[i].formID){
				    $scope.forms[j].fields.push($scope.formsFields[i]);
				}
			    }
			}
		}).error(function(data){
			console.log(data);
		});
		$state.go('collect');
	};
*/

	$scope.logout = function(){
		window.localStorage.removeItem('loggedInUser');
		$state.go('login');
		$scope.closePopover();
	}

	$scope.setPassword = function(){
		$state.go('setPassword');
	}

	$scope.updatePassword = function(){
		$state.go('settings');
	}

            
        
       $scope.goBack = function(){
           $ionicHistory.goBack();
       }

        
               $ionicModal.fromTemplateUrl('pictureSlide.html', {
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
               
               $ionicModal.fromTemplateUrl('addData.html', {
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
               
               $ionicModal.fromTemplateUrl('collect_form.html', {
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
               
               $ionicModal.fromTemplateUrl('collect_project.html', {
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
               
               
               $ionicModal.fromTemplateUrl('collect_site.html', {
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
               
               //Cleanup the modal when we're done with it!
               $scope.$on('$destroy', function() {
                          $scope.sitesModal.remove();
                          $scope.projectModal.remove();
                          $scope.pictureModal.remove();
                          $scope.formsModal.remove();
                          $scope.addDataModal.remove();
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




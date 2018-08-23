'use strict';

/*Messing with Database*/

var cs142App = angular.module('cs142App', ['ngRoute', 'ngMaterial', 'ngResource']);

cs142App.config([
    '$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/users', {
            templateUrl: 'components/user-list/user-listTemplate.html',
            controller: 'UserListController'
        }).when('/users/:userId', {
            templateUrl: 'components/user-detail/user-detailTemplate.html',
            controller: 'UserDetailController'
        }).when('/photos/:userId', {
            templateUrl: 'components/user-photos/user-photosTemplate.html',
            controller: 'UserPhotosController'
        }).when('/login-register', {
            templateUrl: 'components/login-register/login-registerTemplate.html',
            controller: 'LoginRegisterController'
        }).when('/favorites', {
            templateUrl: 'components/favorites/favoritesTemplate.html',
            controller: 'FavoritesController'
        }).otherwise({redirectTo: '/users'});
    }
]);

cs142App.controller('MainController', [
    '$scope',
    '$resource',
    '$rootScope',
    '$location',
    '$http',
    function($scope, $resource, $rootScope, $location, $http, $routeParams) {

        var allUsers = $resource('/user/list');
        var info = $resource('/test/info');
        var userLogout = $resource('/admin/logout');

        $scope.main = {};
        $scope.main.title = '';
        $scope.main.currentUser = {};
        $scope.main.loggedIn = {
            logged: false
        };
        $scope.main.uploadModal = false;
        $scope.main.userList = allUsers.query({});

        $scope.schemaInfo = info.get({});

        $scope.logout = function() {
            userLogout.save($scope.main.loggedIn.user, function() {
                //logout succeeded
                $scope.main.loggedIn.logged = false;
                $scope.main.loggedIn.user = {};
                $location.path('/login-register');
            }, function(err) {
                if (err) {
                    //logout failed
                    $scope.main.title = err.data;
                }
            });
        };

        var selectedPhotoFile; // Holds the last file selected by the user

        $scope.msg = '';

        $scope.closeModal = function(){
            $scope.msg = '';
            $scope.main.uploadModal = false;
        };

        // Called on file selection - we simply save a reference to the file in selectedPhotoFile
        $scope.inputFileNameChanged = function(element) {
            selectedPhotoFile = element.files[0];
        };

        // Has the user selected a file?
        $scope.inputFileNameSelected = function() {
            return !!selectedPhotoFile;
        };

        // Upload the photo file selected by the user using a post request to the URL /photos/new
        $scope.uploadPhoto = function() {
            if (!$scope.inputFileNameSelected()) {
                console.error("uploadPhoto called will no selected file");
                return;
            }
            console.log('fileSubmitted', selectedPhotoFile);

            // Create a DOM form and add the file to it under the name uploadedphoto
            var domForm = new FormData();
            domForm.append('uploadedphoto', selectedPhotoFile);

            // Using $http to POST the form
            $http.post('/photos/new', domForm, {
                transformRequest: angular.identity,
                headers: {
                    'Content-Type': undefined
                }
            }).success(function(newPhoto) {
                // The photo was successfully uploaded. XXX - Do whatever you want on success.
                console.log('uploaded photo: ');
                console.log(newPhoto);
                $location.path('/login-register');
                $location.path('/photos/' + $scope.main.loggedIn.user._id);
                $scope.msg = "Photo Uploaded!!";
            }).error(function(err) {
                // Couldn't upload the photo. XXX  - Do whatever you want on failure.
                $scope.msg = err.data;
            });

        };

        $scope.addPhoto = function() {
            console.log('adding photo');
            $scope.main.uploadModal = !$scope.main.uploadModal;
        };

        $rootScope.$on("$routeChangeStart", function(event, next, current) {
            if (!$scope.main.loggedIn.logged) {
                // no logged user, redirect to /login-register unless already there
                if (next.templateUrl !== "components/login-register/login-registerTemplate.html") {
                    $location.path("/login-register");
                }
            }
        });

        $scope.getUserAttr = function(attr, id) {
            return $scope.main.userList.find(function(obj) {
                return obj._id === id;
            })[attr];
        };

    }
]);

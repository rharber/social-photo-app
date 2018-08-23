'use strict';

cs142App.controller('LoginRegisterController', [
    '$scope',
    '$routeParams',
    '$resource',
    '$location',
    function($scope, $routeParams, $resource, $location) {
        /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
        var userId = $routeParams.userId;
        var loginUser = $resource('/admin/login');
        var addUser = $resource('/user');
        var allUsers = $resource('/user/list');

        $scope.main.title = 'Login/Register';

        $scope.login_name = '';
        $scope.password = '';

        $scope.newUser = {
            login_name: '',
            first_name: '',
            last_name: '',
            location: '',
            description: '',
            occupation: '',
            password: '',
            rePass: ''
        };

        $scope.errorMSG = '';
        $scope.successMSG = '';

        $scope.clearMSG = function() {
            $scope.errorMSG = '';
        };

        $scope.clearFields = function() {
            $scope.login_name = '';
            $scope.pass = '';
            for (var prop in $scope.newUser) {
                $scope.newUser[prop] = '';
            }
        };

        $scope.login = function() {
            loginUser.save({
                login_name: $scope.login_name,
                password: $scope.password
            }, function(user) {
                $scope.successMSG = "Login Successful";
                $scope.main.loggedIn.user = user;
                $scope.main.loggedIn.logged = true;
                $scope.main.userList = allUsers.query({});
                $location.path('/users');
                console.log($scope.main.loggedIn);
            }, function(err) {
                $scope.errorMSG = err.data;
            });
        };

        $scope.register = function() {
            for (var prop in $scope.newUser) {
                if (prop !== 'location' | 'occupation' | 'description' && $scope.newUser[prop].length === 0) {
                    $scope.errorMSG = '' + prop + ' Empty';
                    return;
                }
            }

            if ($scope.newUser.password !== $scope.newUser.rePass) {
                $scope.errorMSG = 'Password must match the re-entered password.';
                return;
            }

            var createUser = $scope.newUser;

            addUser.save({
                login_name: $scope.newUser.login_name,
                password: $scope.newUser.password,
                first_name: $scope.newUser.first_name,
                last_name: $scope.newUser.last_name,
                location: $scope.newUser.location,
                description: $scope.newUser.description,
                occupation: $scope.newUser.occupation
            }, function(user) {
                console.log(user.first_name);
                $scope.clearMSG();
                $scope.clearFields();
                $scope.successMSG = "Register Successful";
            }, function(err) {
                $scope.errorMSG = err.data;
            });
        };

    }
]);

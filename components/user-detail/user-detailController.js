'use strict';

cs142App.controller('UserDetailController', [
    '$scope',
    '$routeParams',
    '$resource',
    function($scope, $routeParams, $resource) {
        /*
     * Since the route is specified as '/users/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */
        var userId = $routeParams.userId;
        var oneUser = $resource('/user/:id');
        var deleter = $resource('/deleteuser/:id');
        //var userLogout = $resource('/admin/logout');

        $scope.prompting = false;

        $scope.main.currentUser = oneUser.get({
            id: userId
        }, function() {
            $scope.main.title = 'Details of ' + $scope.main.currentUser.first_name;
        });

        $scope.togglePrompt = function() {
            $scope.prompting = !$scope.prompting;
        };

        $scope.checkUser = function(id) {
            if ($scope.main.loggedIn.logged && id === $scope.main.loggedIn.user._id) {
                //owner profile
                return true;
            } else {
                //not owner's profile
                return false;
            }
        };

        $scope.deleteUser = function(userId) {
            deleter.delete({
                id: userId
            }, function() {
                console.log('user deleted');
                //need to logout
                $scope.$parent.logout();
            }, function(err) {
                console.log(err);
            });
        };

    }
]);

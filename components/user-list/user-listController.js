'use strict';

cs142App.controller('UserListController', [
    '$scope',
    function($scope) {

        $scope.changeUser = function(newUserID) {
            if ($scope.main.currentUserID !== newUserID) {
                $scope.main.currentUserID = newUserID;
            }
        };

        $scope.main.title = 'Users';

    }
]);

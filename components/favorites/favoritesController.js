'use strict';

cs142App.controller('FavoritesController', [
    '$scope',
    '$resource',
    function($scope, $resource) {

        var oneUser = $resource('/user/:id');
        var favPhotos = $resource('/favorites');
        var favoriting = $resource('/favPhoto/:photo_id');

        $scope.commText = '';
        $scope.photoModal = false;
        $scope.currentPhoto = '';
        $scope.caption = '';

        $scope.main.currentUser = oneUser.get({
            id: $scope.main.loggedIn.user._id
        }, function() {
            $scope.main.title = 'Favorites of ' + $scope.main.currentUser.first_name;
        });

        $scope.userFaves = favPhotos.query({});

        $scope.updateAllFaves = function() {
            $scope.userFaves = favPhotos.query({});
        };

        $scope.modalOn = function(photo) {
            $scope.photoModal = true;
            $scope.currentPhoto = photo.file_name;
            var date = new Date(Date.parse(photo.date_time));
            $scope.caption = date.toString();
        };

        $scope.modalOff = function() {
            $scope.photoModal = false;
            $scope.currentPhoto = '';
            $scope.caption = '';
        };

        $scope.favPhoto = function(photoId) {
            favoriting.save({
                photo_id: photoId
            }, {
                user_id: $scope.main.loggedIn.user._id
            }, function(photo) {
                console.log(photo);
                console.log(' was faved');
                $scope.updateAllFaves();
                $scope.commText = '';
            }, function(err) {
                console.log(err.data);
            });
        };

    }
]);

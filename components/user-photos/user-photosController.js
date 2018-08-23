'use strict';

cs142App.controller('UserPhotosController', [
    '$scope',
    '$routeParams',
    '$resource',
    function($scope, $routeParams, $resource) {
        /*
     * Since the route is specified as '/photos/:userId' in $routeProvider config the
     * $routeParams  should have the userId property set with the path from the URL.
     */

        var userId = $routeParams.userId;
        var oneUser = $resource('/user/:id');
        var allPhotos = $resource('/photosOfUser/:id');
        var commenting = $resource('/commentsOfPhoto/:photo_id');
        var liking = $resource('/likePhoto/:photo_id');
        var favoriting = $resource('/favPhoto/:photo_id');
        var deleter = $resource('/delete/:type/:commId/:photoId');

        $scope.commText = '';

        $scope.main.currentUser = oneUser.get({
            id: userId
        }, function() {
            $scope.main.title = 'Photos of ' + $scope.main.currentUser.first_name;
        });

        $scope.userPhotos = allPhotos.query({id: userId});

        $scope.updateAllPhotos = function() {
            $scope.userPhotos = allPhotos.query({id: userId});
        };

        $scope.addComment = function(photoId, comm) {
            commenting.save({
                photo_id: photoId
            }, {
                comment: comm
            }, function(photo) {
                console.log('comment added to ');
                console.log(photo);
                $scope.updateAllPhotos();
                $scope.commText = '';
            }, function(err) {
                console.log(err);
            });
        };

        $scope.checkOwn = function(id) {
            //check ownership of photo/comment
            if ($scope.main.loggedIn.logged && id === $scope.main.loggedIn.user._id) {
                return true;
            } else {
                return false;
            }
        };

        $scope.didLike =  function(theLikes){
            if(theLikes.indexOf($scope.main.loggedIn.user._id) !== -1) {
                return true;
            } else {
                return false;
            }
        };

        $scope.isFav =  function(theFaves){
            if(theFaves.indexOf($scope.main.loggedIn.user._id) !== -1) {
                return true;
            } else {
                return false;
            }
        };

        $scope.likePhoto = function(photoId) {
            liking.save({
                photo_id: photoId
            }, {
                user_id: $scope.main.loggedIn.user._id
            }, function(photo) {
                console.log(photo);
                console.log(' was liked');
                $scope.updateAllPhotos();
                $scope.commText = '';
            }, function(err) {
                console.log(err.data);
            });
        };

        $scope.favPhoto = function(photoId) {
            favoriting.save({
                photo_id: photoId
            }, {
                user_id: $scope.main.loggedIn.user._id
            }, function(photo) {
                console.log(photo);
                console.log(' was faved');
                $scope.updateAllPhotos();
                $scope.commText = '';
            }, function(err) {
                console.log(err.data);
            });
        };

        $scope.deletePhoto = function(photoId) {
            //delete the photo of id passed

            deleter.delete({
                type: 'photo',
                commId: -1,
                photoId: photoId
            }, function() {
                console.log('photo deleted');
                $scope.updateAllPhotos();
            }, function(err) {
                console.log(err);
            });
        };

        $scope.deleteComm = function(commId, photoId) {
            //delete the comm of id passed

            deleter.delete({
                type: 'comment',
                commId: commId,
                photoId: photoId
            }, function() {
                console.log('comment deleted');
                $scope.updateAllPhotos();
            }, function(err) {
                console.log(err);
            });

        };

        $scope.helper = function(obj) {
            console.log();
        };
    }
]);

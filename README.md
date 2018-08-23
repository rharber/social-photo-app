# social-photo-app
Social network web app for posting, sharing, favoriting, and commenting on photos.

# Installation
- Install MongoDB
- `npm install`
- `mongod`
- `node loadDatabase.js`
- Install Nodemon
- `nodemon webServer.js`

# Functionality

- ALL STORIES IN ONE VIDEO: https://vimeo.com/208750876
- PASSWORD FOR VIDEO (Case Sensitive): `webapp_finaldemo_ryanharber`

- Story 1
* Story number and name:  5 - Deleting
* Story points:  4
* Brief description to see the story in action:
* Delete buttons automatically appear next to comments, photos, and users that can be deleted by logged in user.
* Click this button to delete the associated object(s).

- Story 2
* Story number and name:  6 - Photo Likes
* Story points:  4
* Brief description to see the story in action:
* Hit the like button on any photo... hit it again to unlike... total will update accordingly.
* Likes are deleted along with user... photos always sort descending by likes on user photos pages.

- Story 3
* Story number and name:  7 - Favorites
* Story points:  6
* Brief description to see the story in action:
* Hit the favorite button on any photo... button is disabled once favorited.
* Click favorites link in sidebar to go to user favorites... photo thumbnails show in list.
* Click the 'x' on any thumbnail favorite to remove it from the favorites list... this updates photos everywhere.
* Click on the thumbnail image to see full size image modal popup with date created... click x to close modal.
* Favorites are delted along with user account.

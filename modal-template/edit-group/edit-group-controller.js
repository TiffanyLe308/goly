(function() {
    'use strict';
    angular.module('edit.group.controller', [
        'ui.router',
        'user.service'
    ])
        .controller('EditGroupController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                     UserService, ShopService, Notification) {

        ///////////////////////////////////////////
        ///////////// INITIAL DATA ////////////////
        ///////////////////////////////////////////

        // Get current user info
        // If not exist, redirect to login page
        var token = UserService.getUserInfo();
        var currentUser;
        if(!token){
            Notification.error({
                message: 'Cannot identify user. Please login first!',
                positionY: 'top',
                positionX: 'center'
            });
            $state.go("login");
        }else{
            currentUser = token.currentUser;
        }

        // Get shop Id
        var shopId = currentUser.listShopIds[0];


        ///////////////////////////////////////////
        //////////////// METHOD ///////////////////
        ///////////////////////////////////////////

        $scope.close = function(){
            $uibModalInstance.dismiss('cancel');
        };

        $scope.newGroupName = $scope.params.group.name;
        $scope.newGroupDescription = $scope.params.group.description;
        $scope.editGroup = function(groupName) {
          ShopService.editGroup(
              shopId,
              $scope.params.group.id, // groupId
              groupName,   // name of group
              $scope.newGroupDescription,    // description of group
              function (response) {
                  if (response.status == 'OK') {
                      Notification.success({
                          message: response.message,
                          positionY: 'top',
                          positionX: 'center'
                      });

                      // Finishing editing group
                      $uibModalInstance.close();
                  } else {
                      Notification.error({
                          message: response.message,
                          positionY: 'top',
                          positionX: 'center'
                      });
                  }
              }
          );
        };

        $scope.deleteWarning = false;
        $scope.showDeleteWarning = function () {
            $scope.deleteWarning = true;
        };
        $scope.cancelDelete = function () {
            $scope.deleteWarning = false;
        };

        $scope.deleteGroup = function () {
            ShopService.deleteGroup(
            shopId,
            $scope.params.group.id,
            function (response) {
                if (response.status == 'OK') {
                    // Finishing deleting group
                    $uibModalInstance.close();
                } else {
                    Notification.error({
                        message: response.message,
                        positionY: 'top',
                        positionX: 'center'
                    });
                }
            });
        };

    });
}());

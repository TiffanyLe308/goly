(function() {
    'use strict';
    angular.module('create.group.controller', [
        'ui.router',
        'user.service'
    ])
        .controller('CreateGroupController', function ($scope, $state, $uibModalInstance, $mixpanel,
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

        $scope.createGroup = function() {
          ShopService.addGroup(
              shopId,
              $scope.groupName,   // name of group
              $scope.groupDescription,    // description of group
              function (response) {
                  if (response.status == 'OK') {
                      Notification.success({
                          message: response.message,
                          positionY: 'top',
                          positionX: 'center'
                      });
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

    });
}());

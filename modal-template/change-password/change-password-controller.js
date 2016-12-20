(function () {
    'use strict';
    angular.module('change.password.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('ChangePasswordController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                          UserService, GeneralService, ShopService, Notification) {

            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.changePassword = function () {
                // Check if new password is valid
                if ($scope.newPassword.length < 6) {
                    Notification.error({
                        message: 'New password must contain minimum 6 characters',
                        positionY: 'top',
                        positionX: 'center'
                    });
                    return;
                }

                // Track in Mixpanel
                if ($mixpanel) {
                    $mixpanel.track('USER > CHANGE PASSWORD', {});
                }

                UserService.changePassword(
                    $scope.newPassword,
                    $scope.oldPassword,
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

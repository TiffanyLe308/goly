(function () {
    'use strict';
    angular.module('request.payout.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('RequestPayoutController', function ($scope, $state, $uibModalInstance, UserService,
                                                         OrderService, Notification, $location) {

            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////

            // Get current user info
            // If not exist, redirect to login page
            var token = UserService.getUserInfo();
            var currentUser;
            if (!token) {
                Notification.error({
                    message: 'Cannot identify user. Please login first!',
                    positionY: 'top',
                    positionX: 'center'
                });
                $state.go("login");
            } else {
                currentUser = token.currentUser;
            }
            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.sendRequest = function () {
                OrderService.requestPayout(
                    $scope.orderId,    // description of group
                    function (response) {
                        if (response.status == 'OK') {
                            Notification.success({
                                message: 'Your request has been sent',
                                positionY: 'top',
                                positionX: 'center'
                            });

                            $uibModalInstance.close();
                        } else {
                            Notification.error({
                                message: 'Your request cannot be sent. Please try again!',
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    }
                );
            };
        });
}());

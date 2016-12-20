(function () {
    'use strict';
    angular.module('send.network.invitation.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('SendNetworkInvitationController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                                 UserService, Notification, ConversationService) {

            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////

            // Get current user info
            // If not exist, redirect to login page
            var currentUser = UserService.requiredLogin(true);
            if (!currentUser) {
                return;
            }

            // Default message
            $scope.message = {
                sender: 'shop' + currentUser.listShopIds[0],
                message: 'Hi,\nI would like to invite you to connect to my network.'
            };
            $scope.members = ['shop' + $scope.params.shop.id, 'shop' + currentUser.listShopIds[0]];

            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.sendInvitation = function () {
                ConversationService.createConversation(
                    $scope.members,
                    'INVITATION',
                    $scope.message,
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
                                message: response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    });
            };
        });
}());

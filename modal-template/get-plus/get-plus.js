(function () {
    'use strict';
    angular.module('get.plus.controller', [
            'ui.router'
        ])
        .controller('GetPlusController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                   $rootScope, ShopService, Notification) {

            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////

            var token  = $rootScope.userSession;
            var shopId = null;
            var userId = null;

            $scope.confirmed = false;

            if (!token) {
                $scope.unregistered = true;
            } else {
                shopId = token.currentUser.listShopIds.length ? token.currentUser.listShopIds[0] : null;
                userId = token.currentUser.id;
            }

            ///////////////////////////////////////////
            //////////////// METHOD ///////////////////
            ///////////////////////////////////////////

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.getPlus = function () {
                if (!token && !$scope.name) {
                    Notification.error({
                        message  : 'Name cannot be empty',
                        positionY: 'top',
                        positionX: 'center'
                    });
                    return;
                }
                if (!token && !$scope.email) {
                    Notification.error({
                        message  : 'Email cannot be empty',
                        positionY: 'top',
                        positionX: 'center'
                    });
                    return;
                }
                if (!token && !$scope.phone) {
                    Notification.error({
                        message  : 'Phone number cannot be empty',
                        positionY: 'top',
                        positionX: 'center'
                    });
                    return;
                }
                if (!$scope.type) {
                    Notification.error({
                        message  : 'Please choose the subscription that you want!',
                        positionY: 'top',
                        positionX: 'center'
                    });
                    return;
                }

                var moreDetails = ' Type: ' + $scope.type;
                moreDetails     = moreDetails + '; Name: ' + token ? token.curretUser.fullName : $scope.name;

                ShopService.requestUpgrade(
                    shopId,
                    userId,
                    token ? token.currentUser.formattedPhone : $scope.phone,
                    token ? token.currentUser.email : $scope.email,
                    moreDetails,
                    function (response) {
                        if (response.status === 'OK') {
                            Notification.success({
                                message  : 'Thank you for your request. We will contact you within 1-2 working days.',
                                positionY: 'top',
                                positionX: 'center'
                            });
                            $uibModalInstance.close();
                        } else {
                            Notification.error({
                                message  : response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    }
                );
            };
        });
}());

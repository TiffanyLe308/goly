(function () {
    'use strict';
    angular.module('recommend.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('RecommendController', function ($scope, $state, ShopService, ServiceService, Notification,
                                                     $uibModalInstance, $rootScope, $mixpanel, ConversationService,
                                                     OrderService) {

            var shop             = {};
            var options          = {
                role: $scope.params.role
            };
            $scope.shopsReady    = false;
            $scope.servicesReady = false;
            $scope.listShopIds   = [];
            $scope.listShops     = [];
            $scope.listServices  = [];

            // RECOMMEND SHOP BUTTON
            $scope.shopButton        = {
                text: 'SELECT'
            };
            $scope.shopButton.action = function (shopId) {
                options.recommendId   = shopId;
                options.recommendType = 'SHOP';
                sendMessage();
            };

            // RECOMMEND SERVICE BUTTON
            $scope.serviceButton                   = {
                firstButton: 'SELECT',
            };
            $scope.serviceButton.firstButtonAction = function (serviceId) {
                options.recommendId   = serviceId;
                options.recommendType = 'SERVICE';
                sendMessage();
            };

            ShopService.getShop($scope.params.order.shopId, function (response) {
                if (response.status === 'OK') {
                    if (response.shop) {
                        shop = response.shop;
                        _.forEach(shop.friendList, function (value) {
                            var friend = ConversationService.memberToObject(value);
                            if (friend.role === 'shop') {
                                $scope.listShopIds.push(friend.id);
                            }
                        });

                        getShops();
                        getServices();
                    }
                } else {
                    Notification.error({
                        message  : response.message,
                        positionY: 'top',
                        positionX: 'center'
                    });
                }
            });

            var sendMessage = function () {
                OrderService.sendMessage($scope.params.orderId, $scope.params.type, options, function (response) {
                    if (response.status === 'OK') {
                        Notification.success({
                            message  : response.message,
                            positionY: 'top',
                            positionX: 'center'
                        });

                        $uibModalInstance.close(response);
                    } else {
                        Notification.error({
                            message  : response.message,
                            positionY: 'top',
                            positionX: 'center'
                        });
                    }
                });
            };

            var getShops = function () {
                ShopService.getListShop($scope.listShopIds, function (response) {
                    if (response.status == 'OK') {
                        $scope.listShops = response.shops;
                        console.log(response);
                        $scope.shopsReady = true;
                    } else {
                        Notification.error({
                            message  : response.message,
                            positionY: 'bottom',
                            positionX: 'center'
                        });
                    }
                });
            };

            var getServices = function () {
                ServiceService.listServicesByShops($scope.listShopIds, function (response) {
                    if (response.status == 'OK') {
                        $scope.listServices = response.services;
                        console.log(response);
                        $scope.servicesReady = true;
                    } else {
                        Notification.error({
                            message  : response.message,
                            positionY: 'bottom',
                            positionX: 'center'
                        });
                    }
                });
            };

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };


        });
}());
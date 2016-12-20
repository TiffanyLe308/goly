(function () {
    'use strict';
    angular.module('payment.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('PaymentController', function ($scope, $state, $uibModalInstance, OrderService, $mixpanel,
                                                   UserService, ShopService, Notification, CONFIG) {

            var token = UserService.getUserInfo();
            var currentUser;
            if (!token) {
                Notification.error({
                    message  : 'Cannot identify user. Please login first!',
                    positionY: 'top',
                    positionX: 'center'
                });
                $state.go("login");
            } else {
                currentUser = token.currentUser;
            }

            $scope.usingGolyPoints  = false;
            $scope.golyPoint        = currentUser.golyPoints;
            $scope.pointValue       = 0;
            $scope.golyPointsAmount = 0;
            $scope.oneAtATime       = true;
            $scope.directPayment    = false;
            $scope.total            = $scope.order.orderPrice.price + $scope.order.orderPrice.serviceFee - $scope.order.orderPrice.discountAmount;
            $scope.status           = {
                isFirstOpen    : true,
                isFirstDisabled: false
            };

            // Track with Facebook
            if (fbq) {
                fbq('track', 'InitiateCheckout', {
                    value       : $scope.order.orderPrice.price,
                    currency    : $scope.order.orderPrice.currency,
                    content_name: $scope.order.serviceName,
                    content_ids : $scope.order.serviceId
                });
            }

            $scope.PAGA_RETURN_URL        = CONFIG.apiUrl + "/payment/pagaConfirmCharge";
            $scope.INTERSWITCH_RETURN_URL = CONFIG.apiUrl + "/payment/interSwitchReturn";

            $scope.creditCard = {};

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.getGolyPointValue = function () {
                if ($scope.golyPointsAmount > $scope.order.usableGolyPoint) {
                    Notification.error({
                        message  : 'Maximum GolyPoint can use is: ' + $scope.order.usableGolyPoint,
                        positionY: 'top',
                        positionX: 'center'
                    });
                    $scope.pointValue       = 0;
                    $scope.golyPointsAmount = 0;
                    $scope.total            = $scope.order.orderPrice.price + $scope.order.orderPrice.serviceFee - $scope.order.orderPrice.discountAmount;
                    return;
                }
                OrderService.getGolyPointValue(
                    $scope.golyPointsAmount,
                    $scope.order.orderPrice.currency,
                    function (response) {
                        if (response.status == 'OK') {
                            $scope.pointValue = response.pointValue;
                            $scope.total      = $scope.order.orderPrice.price + $scope.order.orderPrice.serviceFee - $scope.order.orderPrice.discountAmount - response.pointValue;

                            // Update Interswitch Setting
                            $scope.getInterSwitchSetting($scope.total, $scope.INTERSWITCH_RETURN_URL, $scope.order.id, $scope.pointValue);
                        } else {
                            Notification.error({
                                message  : response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    });
            };

            $scope.switchUsingGolyPoint = function () {
                $scope.usingGolyPoints = !$scope.usingGolyPoints;
                if ($scope.usingGolyPoints === false) {
                    $scope.pointValue       = 0;
                    $scope.golyPointsAmount = 0;
                    $scope.total            = $scope.order.orderPrice.price + $scope.order.orderPrice.serviceFee - $scope.order.orderPrice.discountAmount;

                    // Update Interswitch Setting
                    $scope.getInterSwitchSetting($scope.total, $scope.INTERSWITCH_RETURN_URL, $scope.order.id, $scope.pointValue);
                }

            };

            $scope.getInterSwitchSetting = function (amount, redirectUrl, orderId, usingPoint) {
                OrderService.getInterSwitchSetting(
                    amount,
                    redirectUrl,
                    orderId,
                    usingPoint,
                    function (response) {
                        if (response.status == 'OK') {
                            $scope.interSwitchSetting              = response.interSwitchSetting;
                            $scope.interSwitchSetting.customerId   = currentUser.id;
                            $scope.interSwitchSetting.customerName = currentUser.firstName + ' ' + currentUser.lastName;
                        } else {
                            Notification.error({
                                message  : response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    });
            };

            $scope.recordInterSwitchTransaction = function (transaction) {
                OrderService.recordInterSwitchTransaction(transaction, function (response) {
                    // Don't need to do anything
                });
            };

            $scope.changePaymentMethod = function () {
                // Hide Goly points if using direct payment
                if ($scope.directPayment && $scope.usingGolyPoints) {
                    $scope.switchUsingGolyPoint();
                }
            };

            $scope.payWithCash = function () {
                var options = {
                    role: 'USER'
                };
                OrderService.sendMessage(
                    $scope.$parent.order.id,
                    'ACCEPT',
                    options, function (response) {
                        if (response.status == 'OK') {
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

            $scope.getInterSwitchSetting($scope.total, $scope.INTERSWITCH_RETURN_URL, $scope.order.id, $scope.pointValue);

        });
}());

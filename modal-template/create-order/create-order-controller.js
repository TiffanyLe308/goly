(function () {
    'use strict';
    angular.module('create.order.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('CreateOrderController', function ($scope, $state, $uibModalInstance, $mixpanel,
                                                       UserService, OrderService, Notification) {
            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////

            // Get current user info
            // If not exist, redirect to login page
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

            // Initial date picker data
            var today         = moment();
            $scope.minDate    = new Date(); // today
            $scope.maxDate    = today.add(1, 'years'); // 1 year later
            $scope.datePicker = {
                opened: false
            };
            $scope.options    = {
                country: currentUser.country
            };
            $scope.location   = null;

            // Get booking serviceId and shopId
            var serviceId = $scope.params.serviceId;
            var shopId    = $scope.params.shopId;

            // Prevent user from Ordering his own service
            if (currentUser.listShopIds !== undefined && currentUser.listShopIds.indexOf(shopId) != -1) {
                $scope.disableOrder = true;
            }

            ////////////////////////////////////////////////
            /////////////////// METHOD ///////////////////
            ////////////////////////////////////////////////
            $scope.openDatePicker = function () {
                $scope.datePicker.opened = true;
            };

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.send = function () {
                var requestMessage = '';
                if ($scope.eventType) {
                    requestMessage = requestMessage + 'Type of event: ' + $scope.eventType + '\n';
                }
                if ($scope.attendees) {
                    requestMessage = requestMessage + 'Number of people coming to the event: ' + $scope.attendees + '\n';
                }
                if ($scope.budget) {
                    requestMessage = requestMessage + 'Budget for this service: ' + $scope.budget + '\n';
                }
                requestMessage = requestMessage + 'More information: ' + $scope.message;

                var listMsg = [];
                var msg     = {
                    sender     : 'USER',
                    message    : requestMessage,
                    createdTime: new Date(),
                    type       : 'REQUEST',
                    status     : 'DELIVERED',
                    location   : $scope.location,
                    bookingDate: $scope.bookingDate
                };
                listMsg.push(msg);

                if ($mixpanel) {
                    $mixpanel.track('ORDER > ORDER', {});
                }

                OrderService.orderService(
                    serviceId,          // serviceId
                    shopId,             // shopId
                    listMsg,            // listMessage
                    $scope.location,    // location
                    $scope.bookingDate, // bookingDate
                    'REQUESTED',        // orderStatus
                    function (response) {

                        if (response.status == 'OK') {
                            Notification.success({
                                message  : response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });

                            $uibModalInstance.close(response.order.id);

                            // Track with Facebook
                            if (fbq) {
                                fbq('track', 'AddToCart', {
                                    content_ids: serviceId
                                });
                            }
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

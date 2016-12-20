(function () {
    'use strict';
    angular.module('send.request.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('SendRequestController', function ($scope, $state, $uibModalInstance, Notification,
                                                       UserService, OrderService, CONFIG) {

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

            $scope.options = {
                country: currentUser.country
            };

            $scope.location = '';
            if ($scope.$parent.params !== undefined && $scope.$parent.params.order !== undefined) {
                $scope.bookingDate = $scope.$parent.params.order.bookedDate;
                $scope.location    = $scope.$parent.params.order.location;
            }

            $scope.close = function () {
                $uibModalInstance.dismiss('cancel');
            };

            $scope.openDatePicker = function () {
                $scope.datePicker.opened = true;
            };

            var handleResponse = function (response) {
                if (response.status == 'OK') {
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
            };

            $scope.send = function () {
                console.log($scope);
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

                var options = {
                    role       : $scope.params.role || UserService.getRole(),
                    message    : requestMessage,
                    bookingDate: $scope.bookingDate,
                    location   : $scope.location
                };

                OrderService.sendMessage($scope.params.orderId, $scope.params.type, options, handleResponse);
            };


        });
}());

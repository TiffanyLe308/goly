(function () {
    'use strict';
    angular.module('send.message.controller', [
            'ui.router',
            'user.service'
        ])
        .controller('SendMessageController', function ($scope, $state, $uibModalInstance, Notification, $mixpanel,
                                                       UserService, OrderService, $uibModal, $rootScope) {

            ///////////////////////////////////////////
            ///////////// INITIAL DATA ////////////////
            ///////////////////////////////////////////

            // Get current user info
            // If not exist, redirect to login page
            var token = UserService.getUserInfo();

            if (!token) {
                Notification.error({
                    message  : 'Cannot identify user. Please login first!',
                    positionY: 'top',
                    positionX: 'center'
                });
                $state.go("login");
            }

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

                if ($scope.params.type === 'OFFER') {
                    $scope.offerReview = false;
                }
            };

            if ($scope.params.order !== undefined) {
                $scope.order                    = $scope.params.order;
                $scope.bookingDate              = $scope.params.order.bookedDate;
                $scope.location                 = $scope.params.order.location;
                //$scope.message = $scope.params.order.descriptionDetail;
                $scope.allowCancelation         = $scope.params.order.allowCancelation;
                $scope.deadlineCancelation      = $scope.params.order.deadlineCancelation;
                $scope.cancelationFeePercentage = $scope.params.order.cancelationFeePercentage;

                if ($scope.params.order.orderPrice !== undefined && $scope.params.order.orderPrice !== null) {
                    $scope.amount       = $scope.params.order.orderPrice.price;
                    $scope.payoutAmount = $scope.params.order.orderPrice.payoutAmount;
                    $scope.handlingFee  = $scope.amount - $scope.payoutAmount;
                } else {
                    $scope.amount       = 0;
                    $scope.payoutAmount = 0;
                    $scope.handlingFee  = 0;
                }
            }

            $scope.firstMessage = ($scope.params.orderId === undefined && $scope.params.type === 'TEXT');

            $scope.currency = token.currentUser.country === 'FI' ? 'EUR' : 'NGN';

            // Initial date picker data
            var today         = moment();
            $scope.minDate    = new Date(); // today
            $scope.maxDate    = today.add(1, 'years'); // 1 year later
            $scope.datePicker = {
                opened: false
            };

            $scope.options = {
                country: token.currentUser.country
            };

            $scope.user = token.currentUser;

            $scope.openDatePicker = function () {
                $scope.datePicker.opened = true;
            };

            $scope.close = function () {
                //$uibModalInstance.close();
                $uibModalInstance.dismiss('cancel');
            };

            $scope.initCancelOrder = function () {
                if (token.currentUser.payoutAccount === undefined || token.currentUser.payoutAccount === null) {
                    $scope.payoutAccount = {
                        type: 'BANK'
                    };
                } else {
                    $scope.payoutAccount = token.currentUser.payoutAccount;
                }
            };

            $scope.submitCancel = function () {
                // Save payout info first
                UserService.registerPayout($scope.payoutAccount, function (data) {
                    if (data.status === 'OK') {
                        token.currentUser.payoutAccount = $scope.payoutAccount;
                        $scope.submit();
                    } else {
                        Notification.error({
                            message  : data.message,
                            positionY: 'top',
                            positionX: 'center'
                        });
                    }
                });
            };

            $scope.submit = function () {
                var options = {
                    role: $scope.params.role || UserService.getRole()
                };
                if ($mixpanel) {
                    $mixpanel.track('ORDER > SEND MESSAGE', {
                        'Message Type': $scope.params.type,
                        'Order Status': !$scope.order ? 'New' : $scope.order.state,
                        'Sender'      : options.role,
                        'Shop Name'   : $scope.order ? $scope.order.shopName : undefined,
                        'Service Name': $scope.order ? $scope.order.serviceName : undefined
                    });
                }

                switch ($scope.params.type) {
                    case 'TEXT':
                    case 'END':
                    case 'CANCEL':
                    case 'COMPLETE':
                    case 'CONFIRM':
                    case 'CONFIRM_PAYMENT':
                    case 'REPORT':
                        options.message = $scope.message;
                        options.status  = 'DELIVERED';
                        break;
                    case 'OFFER':
                        _.merge(options, {
                            location                : $scope.location,
                            price                   : {
                                price   : $scope.amount,
                                currency: UserService.getCurrency()
                            },
                            message                 : $scope.message,
                            bookingDate             : $scope.bookingDate,
                            allowCancelation        : $scope.allowCancelation,
                            deadlineCancelation     : $scope.deadlineCancelation,
                            cancelationFeePercentage: $scope.cancelationFeePercentage
                        });

                        break;
                    case 'FEEDBACK':

                        _.merge(options, {
                            review      : $scope.review,
                            message     : $scope.message,
                            skillValue  : $scope.skillValue,
                            moneyValue  : $scope.moneyValue,
                            qualityValue: $scope.qualityValue
                        });
                        break;
                    // TODO: Refactor into separate funciton
                    case 'PAY':

                        var scope = $rootScope.$new();

                        scope.order = $scope.params.order;
                        scope.shop  = $scope.params.shop;

                        var modal = $uibModal.open({
                            scope      : scope,
                            animation  : true,
                            windowClass: 'payment-window',
                            templateUrl: 'modules/modal-template/payment/payment.html',
                            controller : 'PaymentController',
                            size       : 'lg'
                        });

                        modal.result.then(function (response) {
                            $uibModalInstance.close(response);
                        }, function () {
                            $scope.close();
                        });

                        return;
                    // TODO: Refactor into separate funciton
                    case 'IMAGE':
                        if ($scope.photo) {
                            OrderService.uploadImage($scope.params.orderId, $scope.photo, function (data) {
                                if (data.status === 'OK') {
                                    options.imageUrl = data.url;
                                    options.message  = $scope.imageTitle;

                                    OrderService.sendMessage($scope.params.orderId, $scope.params.type, options, handleResponse);

                                } else {
                                    Notification.error({
                                        message  : data.message,
                                        positionY: 'top',
                                        positionX: 'center'
                                    });
                                }
                            });
                        } else {
                            Notification.error({
                                message  : 'Something went wrong, please try again',
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }

                        break;
                    case 'FILE':
                        if ($scope.file) {
                            OrderService.uploadFile($scope.params.orderId, $scope.file, function (data) {
                                if (data.status === 'OK') {
                                    options.imageUrl = data.url;
                                    options.message  = $scope.fileDescription;
                                    OrderService.sendMessage($scope.params.orderId, $scope.params.type, options, handleResponse);

                                } else {
                                    Notification.error({
                                        message  : data.message,
                                        positionY: 'top',
                                        positionX: 'center'
                                    });
                                }
                            });
                        } else {
                            Notification.error({
                                message  : 'Something went wrong, please try again',
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }

                        break;
                    default:
                        return;
                }

                if ($scope.params.orderId === undefined && $scope.params.type === 'TEXT') {
                    // Send Message to SP
                    var listMsg = [];
                    var msg     = {
                        sender     : 'USER',
                        message    : $scope.message,
                        createdTime: new Date(),
                        type       : 'TEXT',
                        status     : 'DELIVERED'
                    };
                    listMsg.push(msg);

                    OrderService.orderService(
                        $scope.params.serviceId,
                        $scope.params.shopId,
                        listMsg,
                        null,
                        null,
                        'CHAT',
                        function (response) {

                            if (response.status == 'OK') {
                                Notification.success({
                                    message  : response.message,
                                    positionY: 'top',
                                    positionX: 'center'
                                });

                                $uibModalInstance.close(response.order.id);
                            } else {
                                Notification.error({
                                    message  : response.message,
                                    positionY: 'top',
                                    positionX: 'center'
                                });
                            }
                        }
                    );
                }
                else if ($scope.params.type != 'IMAGE' && $scope.params.type != 'FILE') {
                    OrderService.sendMessage($scope.params.orderId, $scope.params.type, options, handleResponse);
                }
            };


            $scope.submitOrder = function () {
                $scope.offer = {
                    location   : $scope.location,
                    price      : {
                        price   : $scope.amount,
                        currency: UserService.getCurrency()
                    },
                    message    : $scope.message,
                    bookingDate: $scope.bookingDate
                };

                $scope.offerReview = true;
            };

            if ($mixpanel) {
              $mixpanel.track('POPUP', {
                'Type': 'Make Offer'
              });
            }


            $scope.back = function () {

                if ($scope.$parent.params.type === 'OFFER') {
                    $scope.offerReview = false;
                }

            };

            $scope.getPayoutAmount = function () {
                OrderService.getPayoutAmount(
                    $scope.params.order.id,
                    $scope.amount,
                    function (response) {
                        if (response.status == 'OK') {
                            $scope.payoutAmount = response.payoutAmount;
                            $scope.handlingFee  = $scope.amount - $scope.payoutAmount;
                        } else {
                            Notification.error({
                                message  : response.message,
                                positionY: 'top',
                                positionX: 'center'
                            });
                        }
                    });
            };


        });
}());

(function () {
    'use strict';

    angular.module('header', [])
        .directive('golyHeader', function (CONFIG) {
            return {
                restrict: 'A',
                templateUrl: 'modules/header/header.html',
                scope: {},
                link: function (scope, element) {
                }
            };
        })
        .directive('uiSrefActiveIf', function ($state, $rootScope) {
            return {
                restrict: 'A',
                controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                    var state = $attrs.uiSrefActiveIf;

                    function update() {
                        if ($state.includes(state) || $state.is(state)) {
                            if ($rootScope.userSession && $rootScope.userSession.currentUser && $state.is('shop')) {
                                if ($rootScope.userSession.currentUser.listShopIds &&
                                    $rootScope.userSession.currentUser.listShopIds.indexOf($state.params.shopId) != -1) {
                                    $element.addClass('menu-active');
                                } else {
                                    $element.removeClass('menu-active');
                                }
                                return;
                            }

                            $element.addClass('menu-active');
                        } else {
                            $element.removeClass('menu-active');
                        }
                    }

                    $scope.$on('$stateChangeSuccess', update);
                    update();
                }]
            };
        })

        .directive('mainNav', function (CONFIG, UserService, $rootScope, $state, $uibModal, Notification) {
            return {
                restrict: 'A',
                templateUrl: 'modules/header/nav.html',
                scope: {
                    hideSearchBar: '='
                },
                link: function ($scope) {
                    var token = $rootScope.userSession;

                    if (token) {
                        $scope.isServiceProvider = token.currentUser.serviceProvider;
                    } else {
                        $scope.visitor = true;
                    }
                },
                controller: function ($scope) {

                    $scope.currentUser = $rootScope.userSession ? $rootScope.userSession.currentUser : undefined;
                    $scope.supported = CONFIG.supportCountries[$rootScope.country].ready;

                    // Show message to remind user to verify email
                    // If verified, then show them the invitation promotion
                    if ($scope.currentUser && !$scope.currentUser.isVerifyEmail) {
                        // Check if user has dismissed the alert or not
                        if (!$rootScope.dismissEmailReminder) {
                            $rootScope.dismissEmailReminder = UserService.checkDismissMessage('verifyEmailReminder', 1);
                            $scope.showVerifyEmail          = !$rootScope.dismissEmailReminder;
                        }
                    } else if ($scope.currentUser) {
                        if (!$rootScope.dismissInvitationReminder) {
                            $rootScope.dismissInvitationReminder = UserService.checkDismissMessage('invitationReminder', 3);
                            $scope.showInvitationReminder        = !$rootScope.dismissInvitationReminder;
                        }
                    }

                    $scope.sendVerifyEmail = function () {
                        $('#alert-verify-email').alert('close');
                        $rootScope.dismissEmailReminder = true;
                        localStorage.setItem('verifyEmailReminder', Date.now());
                        UserService.sendVerifyEmail(
                            function (response) {
                                if (response.status == 'OK') {
                                    Notification.success({
                                        message: response.message,
                                        positionY: 'top',
                                        positionX: 'center'
                                    });
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

                    $scope.remindLater = function (reminder) {
                        if (reminder == 'verifyEmailReminder') {
                            $rootScope.dismissEmailReminder = true;
                        } else if (reminder == 'invitationReminder') {
                            $rootScope.dismissInvitationReminder = true;
                        }
                        localStorage.setItem(reminder, Date.now());
                    };

                    $scope.logout = function () {
                        UserService.logout();
                        $state.go('explore', {}, {reload: true});
                    };

                    $scope.goToMain = function () {
                        $state.go('explore');
                    };

                    $scope.isState = function (state) {
                        if (state == 'explore') {
                            return $state.current.name.substring(0, 7) == 'explore';
                        }
                        return $state.is(state);
                    };

                    $scope.slideDownVisible = false;
                    $scope.toggleSlideDown = function () {
                        $scope.slideDownVisible = !$scope.slideDownVisible;
                    };

                    // Toggle mobile menu
                    $scope.mobileMenuVisible = false;
                    $scope.toggleMobileMenu = function () {
                        $scope.mobileMenuVisible = !$scope.mobileMenuVisible;
                    };

                    // toggle search form
                    $scope.navSearchFormOpen = false;
                    $scope.toggleNavSearchForm = function () {
                        $scope.navSearchFormOpen = !$scope.navSearchFormOpen;
                    };

                    $scope.sendInvitation = function () {
                        $rootScope.dismissInvitationReminder = true;
                        localStorage.setItem('verifyEmailReminder', Date.now());

                        $scope.mobileMenuVisible = false;
                        var scope = $rootScope.$new();
                        var modalInstance = $uibModal.open({
                            scope: scope,
                            animation: true,
                            templateUrl: 'modules/modal-template/send-invitation/send-invitation.html',
                            controller: 'SendInvitationController',
                            size: 'lg'
                        });

                        modalInstance.result.then(function () {

                        }, function () {

                        });
                    };
                }
            };
        });

})();

(function () {
    'use strict';
    angular.module('subpage.controller', [
            'ui.router',
            'user.service',
            'general.service'
        ])
        .config(['$stateProvider', function ($stateProvider) {
            $stateProvider
                .state('terms', {
                    url: '/terms',
                    templateUrl: 'modules/subpages/terms.html',
                    controller: 'SubpageController'
                })
                .state('provide-services', {
                    url: '/provide-services',
                    templateUrl: 'modules/subpages/sell-services.html',
                    controller: 'SubpageController'
                })
                .state('sell-services', {
                    url: '/sell-services',
                    templateUrl: 'modules/subpages/sell-services.html',
                    controller: 'SubpageController'
                })
                .state('privacy', {
                    url: '/privacy',
                    templateUrl: 'modules/subpages/privacy.html',
                    controller: 'SubpageController'
                })
                .state('about-us', {
                    url: '/about-us',
                    templateUrl: 'modules/subpages/about-us.html',
                    controller: 'SubpageController'
                })
                .state('trust-and-safety', {
                    url: '/trust-and-safety',
                    templateUrl: 'modules/subpages/trust.html',
                    controller: 'SubpageController'
                })
                .state('careers', {
                    url: '/careers',
                    templateUrl: 'modules/subpages/careers.html',
                    controller: 'SubpageController'
                })
                .state('plus', {
                    url        : '/plus',
                    templateUrl: 'modules/subpages/plus.html',
                    controller : 'SubpageController'
                })
                .state('finance', {
                    url        : '/finance',
                    templateUrl: 'modules/subpages/finance.html',
                    controller : 'SubpageController'
                })
                .state('404', {
                    url: '/404',
                    templateUrl: 'modules/subpages/404.html',
                    controller: 'SubpageController'
                });
        }])
        .controller('SubpageController', function ($scope, $rootScope, $state, $uibModal, UserService, ServiceService,
                                                   $mixpanel, GeneralService, Notification, CONFIG, $anchorScroll, $location) {
            if ($state.current.name == 'sell-services') {
                $rootScope.pageTitle = 'Sell Event Services, Earn Money and Grow Your Business to Millions';
                $rootScope.pageDescription = 'A platform to run your successful event business. Setup a shop on Goly for free and start getting orders from anywhere. For planners, photographers, vendors, makeup artists, MCs, performers';
            } else if ($state.current.name == 'privacy') {
                $rootScope.pageTitle = 'Privacy Policy';
                $rootScope.pageIndex = 'noindex';
            } else if ($state.current.name == 'trust-and-safety') {
                $rootScope.pageTitle = 'Trust and Safety';
                $rootScope.pageIndex = 'noindex';
            } else if ($state.current.name == 'terms') {
                $rootScope.pageTitle = 'Terms of Service';
                $rootScope.pageIndex = 'noindex';
            } else if ($state.current.name == 'about-us') {
                $rootScope.pageTitle = 'About Us';
                $rootScope.pageDescription = 'At Goly, we envision in empowering people by connecting them with opportunities, tools and learning. Learn more about us!';
            } else if ($state.current.name == 'careers') {
                $rootScope.pageTitle = 'Careers';
                $rootScope.pageDescription = 'At Goly, we strive to become the world’s platform for people to find their voice by building products and services that empower them to do so.!';
            } else if ($state.current.name == 'plus') {
                $rootScope.pageTitle       = 'Goly Plus';
                $rootScope.pageDescription = 'Get more visibility and delight customers with Goly Plus.';
            } else if ($state.current.name == 'careers') {
                $rootScope.pageTitle       = 'Finance';
                $rootScope.pageDescription = '';
            }


            $scope.country = $rootScope.country;

            $scope.visitor = !$rootScope.userSession;
            $scope.topServices = [];

            // Generate signup link if user is not logged in, or create shop link if user is not SP
            if ($scope.visitor) {
                $scope.signupLink = '/signup/register-user';
            } else {
                if (!$rootScope.userSession.currentUser.serviceProvider) {
                    $scope.signupLink = '/signup/register-user/set-up-shop';
                } else {
                    $scope.signupLink = null;
                }
            }


            $rootScope.$on('logout', function () {
                $scope.visitor = true;
            });

            // Set the flag so that Prerender knows that it is ready
            window.prerenderReady = true;

            //============================= Functions ==============================//
            $scope.goToAnchor = function (anchorName) {
                if ($("#" + anchorName).length) {
                    $('html, body').animate({
                        scrollTop: $("#" + anchorName).offset().top
                    }, 1000);
                }
            };

            $scope.getPlus = function () {
                var scope         = $rootScope.$new();
                var modalInstance = $uibModal.open({
                    scope      : scope,
                    animation  : true,
                    templateUrl: 'modules/modal-template/get-plus/get-plus.html',
                    controller : 'GetPlusController',
                    size       : 'lg'
                });

                modalInstance.result.then(function () {

                }, function () {

                });
            };
        });
}());

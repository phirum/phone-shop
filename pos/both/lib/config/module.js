/**
 * Module
 */
Module = typeof Module === 'undefined' ? {} : Module;
Meteor.isClient && Template.registerHelper('Module', Module);

Module.Pos = {
    name: 'POS System',
    version: '0.0.1',
    summary: 'POS System is used for Sale Product: Point of Sale.',
    roles: [
        'admin',
        'general',
        'reporter',
        'seller'
    ]
};

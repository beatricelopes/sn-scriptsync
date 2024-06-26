var count = 0;

if (GlideTableDescriptor.isValid('sp_log')) {
    var ga = new GlideAggregate('sp_log');
    ga.addEncodedQuery('sys_created_onONThis month@javascript:gs.beginningOfThisMonth()@javascript:gs.endOfThisMonth()');
    ga.addQuery('page', 'a60dcc050be432004ce28ffe15673a54');
    ga.addQuery('portal', '81b75d3147032100ba13a5554ee4902b');
    ga.addAggregate('COUNT');
    ga.query();

    if (ga.next()) {
        count = ga.getAggregate('COUNT');
    }
}

answer = count;
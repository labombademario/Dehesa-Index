"""Nombres legibles de los indices oficiales de precios (Eurostat, Defra) que aparecen como productos en data/prices. Compartido por build-coop-report.py y build-data-pack.py."""
IDX = {'cereals': ('Cereales', 'Cereals', 'Céréales', 'Cereali'), 'energy': ('Energía', 'Energy', 'Énergie', 'Energia'), 'fertiliser': ('Fertilizantes', 'Fertiliser', 'Engrais', 'Fertilizzanti'),
       'milk': ('Leche', 'Milk', 'Lait', 'Latte'), 'barley': ('Cebada', 'Barley', 'Orge', 'Orzo'), 'cattle': ('Vacuno', 'Cattle', 'Bovins', 'Bovini'), 'eggs': ('Huevos', 'Eggs', 'Œufs', 'Uova'),
       'feed': ('Piensos', 'Feed', 'Aliments du bétail', 'Mangimi'), 'oilseed_rape': ('Colza', 'Oilseed rape', 'Colza', 'Colza'), 'pigs': ('Porcino', 'Pigs', 'Porcins', 'Suini'),
       'sheep': ('Ovino', 'Sheep', 'Ovins', 'Ovini'), 'wheat': ('Trigo', 'Wheat', 'Blé', 'Grano')}
def index_name(prod):
    """eurostat_milk_output_index -> Índice de precios percibidos: Leche (Eurostat). None si no es un índice conocido."""
    for src in ('eurostat', 'defra'):
        for kind in ('output', 'input'):
            suf = '_%s_index' % kind
            if prod.startswith(src + '_') and prod.endswith(suf):
                k = prod[len(src) + 1:-len(suf)]
                if k not in IDX: return None
                es, en, fr, it = IDX[k]; S = 'Eurostat' if src == 'eurostat' else 'Defra'
                if kind == 'output': return {'es': 'Índice de precios percibidos: %s (%s)' % (es, S), 'en': 'Output price index: %s (%s)' % (en, S), 'fr': 'Indice des prix à la production : %s (%s)' % (fr, S), 'it': 'Indice dei prezzi alla produzione: %s (%s)' % (it, S)}
                return {'es': 'Índice de precios pagados: %s (%s)' % (es, S), 'en': 'Input price index: %s (%s)' % (en, S), 'fr': 'Indice des prix d’achat : %s (%s)' % (fr, S), 'it': 'Indice dei prezzi dei mezzi di produzione: %s (%s)' % (it, S)}
    return None


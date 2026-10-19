# -*- coding: utf-8 -*-
"""Etiqueta legible de las unidades de la API (que guarda identificadores internos: 'tonelada', 'ton_corta', 'index_2020_100'...)."""
U = {
 'es': {'tonelada': 't', 'ton_corta': 'ton corta', 'barril': 'barril', 'gal': 'galón', 'docena': 'docena', 'litro': 'litro', 'index_2020_100': 'índice 2020=100', 'cwt': 'cwt', '100kg': '100 kg', 'bushel': 'bushel', 'kg': 'kg', 'mmbtu': 'MMBtu', 'lb': 'lb'},
 'en': {'tonelada': 't', 'ton_corta': 'short ton', 'barril': 'barrel', 'gal': 'gallon', 'docena': 'dozen', 'litro': 'litre', 'index_2020_100': 'index 2020=100', 'cwt': 'cwt', '100kg': '100 kg', 'bushel': 'bushel', 'kg': 'kg', 'mmbtu': 'MMBtu', 'lb': 'lb'},
 'fr': {'tonelada': 't', 'ton_corta': 'tonne courte', 'barril': 'baril', 'gal': 'gallon', 'docena': 'douzaine', 'litro': 'litre', 'index_2020_100': 'indice 2020=100', 'cwt': 'cwt', '100kg': '100 kg', 'bushel': 'boisseau (bushel)', 'kg': 'kg', 'mmbtu': 'MMBtu', 'lb': 'lb'},
 'it': {'tonelada': 't', 'ton_corta': 'tonnellata corta', 'barril': 'barile', 'gal': 'gallone', 'docena': 'dozzina', 'litro': 'litro', 'index_2020_100': 'indice 2020=100', 'cwt': 'cwt', '100kg': '100 kg', 'bushel': 'bushel', 'kg': 'kg', 'mmbtu': 'MMBtu', 'lb': 'lb'},
}
def unit_label(u, l):
    return (U.get(l) or U['es']).get(u) or u

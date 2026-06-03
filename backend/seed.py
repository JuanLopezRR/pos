import asyncio
import httpx
import sys

BASE = "http://localhost:8000/api"

PRODUCTOS = [
    # Gaseosas y Bebidas
    {"code": "GAS001", "name": "Coca-Cola 350ml", "sale_price": 2500, "family": "Gaseosas"},
    {"code": "GAS002", "name": "Coca-Cola 1.5L", "sale_price": 4500, "family": "Gaseosas"},
    {"code": "GAS003", "name": "Coca-Cola Light 350ml", "sale_price": 2500, "family": "Gaseosas"},
    {"code": "GAS004", "name": "Coca-Cola Zero 350ml", "sale_price": 2500, "family": "Gaseosas"},
    {"code": "GAS005", "name": "Sprite 350ml", "sale_price": 2300, "family": "Gaseosas"},
    {"code": "GAS006", "name": "Fanta Naranja 350ml", "sale_price": 2300, "family": "Gaseosas"},
    {"code": "GAS007", "name": "Colombiana 350ml", "sale_price": 2200, "family": "Gaseosas"},
    {"code": "GAS008", "name": "Colombiana 1.5L", "sale_price": 4000, "family": "Gaseosas"},
    {"code": "GAS009", "name": "Pepsi 350ml", "sale_price": 2300, "family": "Gaseosas"},
    {"code": "GAS010", "name": "Seven Up 350ml", "sale_price": 2300, "family": "Gaseosas"},
    # Aguas y Jugos
    {"code": "AGU001", "name": "Agua Cristal 500ml", "sale_price": 1500, "family": "Aguas y Jugos"},
    {"code": "AGU002", "name": "Agua Cristal 1.5L", "sale_price": 2500, "family": "Aguas y Jugos"},
    {"code": "AGU003", "name": "Jugo Hit Naranja 1L", "sale_price": 3800, "family": "Aguas y Jugos"},
    {"code": "AGU004", "name": "Jugo Hit Durazno 1L", "sale_price": 3800, "family": "Aguas y Jugos"},
    {"code": "AGU005", "name": "Gatorade Naranja 500ml", "sale_price": 3500, "family": "Aguas y Jugos"},
    # Cervezas
    {"code": "CER001", "name": "Cerveza Águila 330ml", "sale_price": 3200, "family": "Cervezas"},
    {"code": "CER002", "name": "Cerveza Club Colombia 330ml", "sale_price": 4000, "family": "Cervezas"},
    {"code": "CER003", "name": "Cerveza Poker 330ml", "sale_price": 3000, "family": "Cervezas"},
    {"code": "CER004", "name": "Cerveza Costeña 330ml", "sale_price": 2800, "family": "Cervezas"},
    {"code": "CER005", "name": "Cerveza Corona 355ml", "sale_price": 5000, "family": "Cervezas"},
    # Granos y Despensa
    {"code": "GRA001", "name": "Arroz Diana 1kg", "sale_price": 3200, "family": "Granos y Despensa"},
    {"code": "GRA002", "name": "Arroz Diana 500gr", "sale_price": 1800, "family": "Granos y Despensa"},
    {"code": "GRA003", "name": "Frijoles Cargamanto 500gr", "sale_price": 4500, "family": "Granos y Despensa"},
    {"code": "GRA004", "name": "Lentejas 500gr", "sale_price": 3000, "family": "Granos y Despensa"},
    {"code": "GRA005", "name": "Garbanzos 500gr", "sale_price": 3800, "family": "Granos y Despensa"},
    {"code": "GRA006", "name": "Aceite Vegetal 1L", "sale_price": 6800, "family": "Granos y Despensa"},
    {"code": "GRA007", "name": "Sal Refisal 1kg", "sale_price": 1200, "family": "Granos y Despensa"},
    {"code": "GRA008", "name": "Azúcar Manuelita 1kg", "sale_price": 3200, "family": "Granos y Despensa"},
    {"code": "GRA009", "name": "Panela x 500gr", "sale_price": 3500, "family": "Granos y Despensa"},
    {"code": "GRA010", "name": "Café Sello Rojo 250gr", "sale_price": 8500, "family": "Granos y Despensa"},
    # Lácteos
    {"code": "LAC001", "name": "Leche Alpina Entera 1L", "sale_price": 3800, "family": "Lácteos"},
    {"code": "LAC002", "name": "Leche Colanta Entera 1L", "sale_price": 3600, "family": "Lácteos"},
    {"code": "LAC003", "name": "Yogurt Alpina Fresa 500gr", "sale_price": 4500, "family": "Lácteos"},
    {"code": "LAC004", "name": "Queso Campesino 250gr", "sale_price": 6500, "family": "Lácteos"},
    {"code": "LAC005", "name": "Mantequilla Coasun 250gr", "sale_price": 5500, "family": "Lácteos"},
    # Panadería
    {"code": "PAN001", "name": "Pan Bimbo Blanco 400gr", "sale_price": 5200, "family": "Panadería"},
    {"code": "PAN002", "name": "Galletas Festival 100gr", "sale_price": 1800, "family": "Panadería"},
    {"code": "PAN003", "name": "Galletas Saltín Noel 200gr", "sale_price": 3500, "family": "Panadería"},
    {"code": "PAN004", "name": "Tostadas Tosh 150gr", "sale_price": 4200, "family": "Panadería"},
    # Aseo y Hogar
    {"code": "ASE001", "name": "Papel Higiénico Familia x4", "sale_price": 7200, "family": "Aseo y Hogar"},
    {"code": "ASE002", "name": "Jabón Rey Lavanda x3", "sale_price": 4800, "family": "Aseo y Hogar"},
    {"code": "ASE003", "name": "Detergente Ariel 500gr", "sale_price": 6500, "family": "Aseo y Hogar"},
    {"code": "ASE004", "name": "Limpia Vidrios 500ml", "sale_price": 4200, "family": "Aseo y Hogar"},
    {"code": "ASE005", "name": "Cloro 1L", "sale_price": 2800, "family": "Aseo y Hogar"},
    # Snacks y Dulces
    {"code": "SNA001", "name": "Papas Margarita Limón 50gr", "sale_price": 1800, "family": "Snacks y Dulces"},
    {"code": "SNA002", "name": "De Todito Clásico 100gr", "sale_price": 2800, "family": "Snacks y Dulces"},
    {"code": "SNA003", "name": "Chocoramo", "sale_price": 1500, "family": "Snacks y Dulces"},
    {"code": "SNA004", "name": "Gansito Marinela", "sale_price": 2000, "family": "Snacks y Dulces"},
    {"code": "SNA005", "name": "Chocolate Jet 50gr", "sale_price": 2500, "family": "Snacks y Dulces"},
]

FAMILIES = sorted(set(p["family"] for p in PRODUCTOS))

CLIENTES = [
    {"code": "CLI001", "name": "Juan Pérez", "nif": "CC 12345678", "address": "Cra 15 #45-67", "city": "Bogotá", "phone": "3001234567", "email": "juan@email.com"},
    {"code": "CLI002", "name": "María López", "nif": "CC 23456789", "address": "Cll 72 #10-20", "city": "Bogotá", "phone": "3012345678", "email": "maria@email.com"},
    {"code": "CLI003", "name": "Carlos García", "nif": "CC 34567890", "address": "Av El Poblado #5-10", "city": "Medellín", "phone": "3023456789", "email": "carlos@email.com"},
    {"code": "CLI004", "name": "Ana Martínez", "nif": "CC 45678901", "address": "Cll 5 #15-30", "city": "Cali", "phone": "3034567890", "email": "ana@email.com"},
    {"code": "CLI005", "name": "Pedro Rodríguez", "nif": "CC 56789012", "address": "Cra 50 #80-10", "city": "Barranquilla", "phone": "3045678901", "email": "pedro@email.com"},
    {"code": "CLI006", "name": "Laura Jiménez", "nif": "CC 67890123", "address": "Av Las Américas #30-15", "city": "Bogotá", "phone": "3056789012", "email": "laura@email.com"},
    {"code": "CLI007", "name": "Diego Ramírez", "nif": "CC 78901234", "address": "Cll 33 #20-40", "city": "Medellín", "phone": "3067890123", "email": "diego@email.com"},
    {"code": "CLI008", "name": "Sofía Torres", "nif": "CC 89012345", "address": "Cra 23 #55-70", "city": "Cali", "phone": "3078901234", "email": "sofia@email.com"},
    {"code": "CLI009", "name": "Andrés Castro", "nif": "CC 90123456", "address": "Cll 100 #15-25", "city": "Bogotá", "phone": "3089012345", "email": "andres@email.com"},
    {"code": "CLI010", "name": "Valentina Ortiz", "nif": "CC 01234567", "address": "Av Circunvalar #10-50", "city": "Cartagena", "phone": "3090123456", "email": "valentina@email.com"},
    {"code": "CLI011", "name": "Felipe Moreno", "nif": "CC 11223344", "address": "Cra 7 #60-30", "city": "Bogotá", "phone": "3101122334", "email": "felipe@email.com"},
    {"code": "CLI012", "name": "Camila Herrera", "nif": "CC 22334455", "address": "Cll 12 Sur #10-05", "city": "Medellín", "phone": "3112233445", "email": "camila@email.com"},
    {"code": "CLI013", "name": "Roberto Vargas", "nif": "CC 33445566", "address": "Cra 38 #25-10", "city": "Cali", "phone": "3123344556", "email": "roberto@email.com"},
    {"code": "CLI014", "name": "Daniela Rojas", "nif": "CC 44556677", "address": "Cll 80 #40-20", "city": "Bogotá", "phone": "3134455667", "email": "daniela@email.com"},
    {"code": "CLI015", "name": "Javier Mendoza", "nif": "CC 55667788", "address": "Av Boyacá #13-45", "city": "Bogotá", "phone": "3145566778", "email": "javier@email.com"},
]

PROVEEDORES = [
    {"code": "PROV001", "name": "Postobón S.A.", "nif": "NIT 890.900.123-4", "address": "Av 68 #25-10", "city": "Bogotá", "phone": "3151112233", "email": "ventas@postobon.com.co", "contact_person": "Luis Fernández"},
    {"code": "PROV002", "name": "Bavaria S.A.", "nif": "NIT 860.002.534-2", "address": "Cra 7 #100-50", "city": "Bogotá", "phone": "3152223344", "email": "pedidos@bavaria.com.co", "contact_person": "Andrés Gómez"},
    {"code": "PROV003", "name": "Grupo Nutresa S.A.", "nif": "NIT 890.100.456-7", "address": "Cra 50 #10-30", "city": "Medellín", "phone": "3153334455", "email": "ventas@nutresa.com.co", "contact_person": "María Botero"},
    {"code": "PROV004", "name": "Alpina Productos Alimenticios", "nif": "NIT 860.005.678-9", "address": "Autop Norte #80-15", "city": "Bogotá", "phone": "3154445566", "email": "pedidos@alpina.com.co", "contact_person": "Carlos Zapata"},
    {"code": "PROV005", "name": "Colanta", "nif": "NIT 890.901.234-5", "address": "Cll 30 #40-50", "city": "Medellín", "phone": "3155556677", "email": "ventas@colanta.com.co", "contact_person": "Pedro Ochoa"},
    {"code": "PROV006", "name": "Diana Corporación", "nif": "NIT 890.300.345-6", "address": "Cra 45 #15-60", "city": "Cali", "phone": "3156667788", "email": "pedidos@diana.com.co", "contact_person": "Ana Rico"},
    {"code": "PROV007", "name": "Grupo Familia S.A.", "nif": "NIT 890.902.345-6", "address": "Av Pance #20-10", "city": "Cali", "phone": "3157778899", "email": "ventas@familia.com.co", "contact_person": "Lina Moreno"},
    {"code": "PROV008", "name": "Quala S.A.", "nif": "NIT 860.031.234-5", "address": "Cra 19 #90-45", "city": "Bogotá", "phone": "3158889900", "email": "pedidos@quala.com.co", "contact_person": "Diego Peña"},
    {"code": "PROV009", "name": "Mondelez Colombia", "nif": "NIT 860.004.567-8", "address": "Cll 26 #69-10", "city": "Bogotá", "phone": "3159990011", "email": "ventas@mondelez.com.co", "contact_person": "Sofía Rincón"},
    {"code": "PROV010", "name": "Nestlé Colombia", "nif": "NIT 890.903.456-7", "address": "Cra 7 #125-30", "city": "Bogotá", "phone": "3161112233", "email": "pedidos@nestle.com.co", "contact_person": "Felipe Cárdenas"},
]


async def main():
    email = sys.argv[1] if len(sys.argv) > 1 else "admin@demo.com"
    password = sys.argv[2] if len(sys.argv) > 2 else "admin123"

    async with httpx.AsyncClient(base_url=BASE) as client:
        # Login
        r = await client.post("/auth/login", json={"username": email, "password": password})
        if r.status_code != 200:
            print(f"Login failed: {r.status_code} {r.text}")
            print("Make sure the user exists. Register first at http://localhost")
            return
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        client.headers.update(headers)

        # Create families
        family_ids = {}
        for fam_name in FAMILIES:
            r = await client.post("/articles/families", json={"name": fam_name})
            if r.status_code == 200:
                family_ids[fam_name] = r.json()["id"]
                print(f"  Created family: {fam_name}")
            else:
                # Try to get existing
                r2 = await client.get("/articles/families")
                if r2.status_code == 200:
                    for f in r2.json():
                        if f["name"] == fam_name:
                            family_ids[fam_name] = f["id"]
                            print(f"  Already exists: {fam_name}")
                            break

        # Create tax (IVA 19%)
        r = await client.get("/documents/taxes")
        taxes = r.json()
        tax_id = None
        for t in taxes:
            if t["percentage"] == 19:
                tax_id = t["id"]
                break
        if not tax_id:
            r = await client.post("/documents/taxes", json={"name": "IVA 19%", "percentage": 19})
            if r.status_code == 200:
                tax_id = r.json()["id"]
                print("  Created tax: IVA 19%")

        # Create articles
        for p in PRODUCTOS:
            payload = {
                "code": p["code"],
                "name": p["name"],
                "sale_price": p["sale_price"],
                "cost_price": round(p["sale_price"] * 0.65),
                "stock": 50,
                "min_stock": 5,
                "max_stock": 100,
                "family_id": family_ids.get(p["family"]),
                "tax_id": tax_id,
                "stock_type": "units",
                "image_url": f"https://picsum.photos/seed/{p['code']}/100/100",
            }
            r = await client.post("/articles", json=payload)
            if r.status_code == 200:
                print(f"  [{p['code']}] {p['name']} - ${p['sale_price']:,}")
            else:
                print(f"  ERROR {p['code']}: {r.status_code} {r.text[:100]}")
        print(f"\nDone! {len(PRODUCTOS)} products inserted.")

        # Create customers
        for c in CLIENTES:
            r = await client.post("/customers", json=c)
            if r.status_code == 200:
                print(f"  [{c['code']}] {c['name']}")
            else:
                print(f"  ERROR {c['code']}: {r.status_code} {r.text[:100]}")
        print(f"\nDone! {len(CLIENTES)} customers inserted.")

        # Create suppliers
        for s in PROVEEDORES:
            r = await client.post("/suppliers", json=s)
            if r.status_code == 200:
                print(f"  [{s['code']}] {s['name']}")
            else:
                print(f"  ERROR {s['code']}: {r.status_code} {r.text[:100]}")
        print(f"\nDone! {len(PROVEEDORES)} suppliers inserted.")


if __name__ == "__main__":
    asyncio.run(main())

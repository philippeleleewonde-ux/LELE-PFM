# 🪣 Configuration Supabase Storage pour Data Scanner

## Étapes à Suivre

### 1. Créer le Bucket `datascanner-uploads`

1. Allez sur https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/storage/buckets
2. Cliquez sur **"New bucket"**
3. Configurez:
   - **Name**: `datascanner-uploads`
   - **Public bucket**: ✅ **Oui** (pour permettre l'accès aux fichiers)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**:
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `application/pdf`
     - `text/csv`
4. Cliquez sur **"Create bucket"**

### 2. Configurer les Politiques RLS (Row Level Security)

Après avoir créé le bucket, ajoutez ces politiques:

#### Politique 1: Allow Upload (INSERT)
```sql
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'datascanner-uploads');
```

#### Politique 2: Allow Read (SELECT)
```sql
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'datascanner-uploads');
```

#### Politique 3: Allow Delete (DELETE)
```sql
CREATE POLICY "Allow authenticated deletes"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'datascanner-uploads');
```

### 3. Ajouter la Service Role Key

1. Allez sur https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb/settings/api
2. Copiez la **`service_role` key** (⚠️ ATTENTION: Ne JAMAIS exposer cette clé côté frontend !)
3. Ouvrez le fichier `.env` à la racine du projet
4. Remplacez la ligne:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key-here"
   ```
   par:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..."  # Votre vraie clé
   ```

### 4. Tester l'Upload

1. Redémarrez le serveur de développement:
   ```bash
   npm run dev
   ```

2. Allez sur http://localhost:8080/
3. Naviguez vers **HCM Data Scanner**
4. Cliquez sur **"Start Scanning Documents"**
5. Sélectionnez **"Extraction Directe"**
6. Uploadez un fichier Excel de test

### 5. Vérifier que ça fonctionne

Dans le dashboard Supabase Storage, vous devriez voir:
- Le bucket `datascanner-uploads`
- Un dossier avec votre `jobId`
- Les fichiers uploadés dedans

---

## 🔧 Troubleshooting

### Erreur: "Bucket not found"
→ Vérifiez que le bucket s'appelle exactement `datascanner-uploads`

### Erreur: "new row violates row-level security policy"
→ Vérifiez que les politiques RLS sont bien configurées

### Erreur: "SUPABASE_SERVICE_ROLE_KEY not found"
→ Vérifiez que la clé est bien dans le fichier `.env` et que vous avez redémarré le serveur

---

**Une fois ces étapes complétées, l'upload de fichiers fonctionnera à 100% !** 🚀

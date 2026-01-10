# 📊 Guide d'Observabilité - HCM Portal V2

> **Créé**: 2025-11-16
> **Auteur**: elite-saas-developer
> **Objectif**: Implémenter observabilité complète (logs, métriques, traces, alerting)

---

## 🎯 Vue d'Ensemble

**Problème actuel**: Blind operation - impossible de savoir ce qui se passe en production

**Situation AVANT observabilité**:
```
Question: "Le CEO voit-il des données cross-tenant ?"
Réponse:  "Je ne sais pas 🤷"

Question: "Quelle est la latency P95 de /analyze-performance ?"
Réponse:  "Je ne sais pas 🤷"

Question: "Combien de 5xx errors cette semaine ?"
Réponse:  "Je ne sais pas 🤷"
```

**Situation APRÈS observabilité**:
```
Question: "Le CEO voit-il des données cross-tenant ?"
Réponse:  "Non, RLS bloque 100% des cross-tenant queries (dashboard Grafana)"

Question: "Quelle est la latency P95 de /analyze-performance ?"
Réponse:  "420ms (target: < 500ms, dashboard Datadog)"

Question: "Combien de 5xx errors cette semaine ?"
Réponse:  "3 erreurs (alert Sentry envoyée, logs consultables)"
```

---

## 📦 Stack d'Observabilité

| Composant | Outil | Fonction | Priorité |
|-----------|-------|----------|----------|
| **Error Tracking** | Sentry | Capture erreurs frontend + backend | 🔴 Critique |
| **Structured Logs** | Supabase Logs + middleware.ts | JSON logs avec correlation IDs | 🔴 Critique |
| **Metrics** | Supabase Dashboard | DB queries, API calls, function invocations | 🟠 Haute |
| **Distributed Tracing** | OpenTelemetry (optionnel) | Traces cross-service | 🟡 Moyenne |
| **Dashboards** | Grafana/Datadog | Visualisation métriques temps réel | 🟠 Haute |
| **Alerting** | Sentry + Email | Notifications incidents | 🔴 Critique |
| **Uptime Monitoring** | UptimeRobot | Health checks endpoints | 🟠 Haute |

---

## 🚀 PHASE 1: Error Tracking (Sentry) - 30 min

### Étape 1.1: Configuration Sentry Frontend

**Fichier déjà configuré**: `.env`
```bash
VITE_SENTRY_DSN="https://80ef5fbe93c4d5b2f40e4a36c2804c3b@o4508500467326976.ingest.us.sentry.io/4508500474732544"
```

**Vérifier l'intégration** dans `src/main.tsx`:
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0, // 100% des transactions tracées
  replaysSessionSampleRate: 0.1, // 10% des sessions
  replaysOnErrorSampleRate: 1.0, // 100% des erreurs
  environment: import.meta.env.MODE, // development / production
});
```

**Test Sentry**:
```typescript
// Dans la console browser
Sentry.captureMessage('Test Sentry integration');
Sentry.captureException(new Error('Test error tracking'));
```

**Résultat attendu**: Voir les messages dans https://sentry.io/organizations/YOUR_ORG/issues/

---

### Étape 1.2: Ajouter Sentry dans Edge Functions

**Créer**: `supabase/functions/_shared/sentry.ts`
```typescript
import * as Sentry from "https://esm.sh/@sentry/deno@8.x";

export function initSentry() {
  Sentry.init({
    dsn: Deno.env.get("SENTRY_DSN"),
    tracesSampleRate: 1.0,
    environment: Deno.env.get("ENVIRONMENT") || "production",
    beforeSend(event) {
      // Redact sensitive data before sending
      if (event.request?.headers) {
        delete event.request.headers['Authorization'];
      }
      return event;
    },
  });
}

export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.captureException(error, {
    extra: context,
  });
}
```

**Utiliser dans Edge Function**:
```typescript
import { initSentry, captureError } from "../_shared/sentry.ts";

initSentry();

serve(async (req) => {
  try {
    // Your logic
  } catch (error) {
    captureError(error as Error, {
      function: 'analyze-performance',
      user_id: context.user.id,
      company_id: context.companyId,
    });
    throw error;
  }
});
```

---

## 🚀 PHASE 2: Structured Logging - 15 min

### Étape 2.1: Activer Supabase Logs

1. **Dashboard** → https://supabase.com/dashboard/project/yhidlozgpvzsroetjxqb
2. **Logs** → Enable logs
3. **Configuration**:
   - ✅ Database logs
   - ✅ Function logs
   - ✅ API logs
   - Retention: 7 days (gratuit) ou 30 days (Pro plan)

### Étape 2.2: Utiliser le middleware structuré

**Déjà créé**: `supabase/functions/_shared/middleware.ts`

**Le middleware fournit**:
- Logs JSON structurés
- Correlation IDs automatiques
- User/company context dans chaque log
- Niveaux de log (info, warn, error)

**Exemple de log structuré généré**:
```json
{
  "level": "info",
  "message": "User authenticated",
  "timestamp": "2025-11-16T10:30:45.123Z",
  "correlation_id": "abc123-def456-ghi789",
  "user_id": "uuid-here",
  "company_id": "company-abc",
  "email": "ceo@example.com"
}
```

**Avantages**:
- Searchable par correlation_id (tracer une requête de bout en bout)
- Filtrable par company_id (voir tous les logs d'une company)
- Parseable par Grafana/Datadog/Elasticsearch

---

## 🚀 PHASE 3: Métriques & Dashboards - 1h

### Étape 3.1: Métriques Supabase natives

**Dashboard Supabase** → **Reports**

Métriques disponibles gratuitement:
- **Database**:
  - Connection pool utilization
  - Query performance (slow queries)
  - Table sizes
  - Index usage
- **API**:
  - Request rate (req/sec)
  - Error rate (4xx, 5xx)
  - Latency distribution
- **Edge Functions**:
  - Invocations count
  - Execution time
  - Cold starts
  - Error rate

**Action**: Consulter ces dashboards quotidiennement

---

### Étape 3.2: Métriques custom avec Grafana (Optionnel)

**Prérequis**: Supabase Pro plan ($25/mois) pour exporter logs vers Grafana

**Setup**:
1. Créer compte Grafana Cloud (gratuit jusqu'à 10k séries)
2. Dashboard Supabase → Settings → Integrations → Grafana
3. Copier API key et configurer export

**Dashboards recommandés**:

**Dashboard 1: API Health**
```
- Request rate (req/sec) par endpoint
- Error rate (%) par endpoint
- Latency P50/P95/P99 par endpoint
- Status code distribution (2xx, 4xx, 5xx)
```

**Dashboard 2: RLS Performance**
```
- RLS policy execution time moyenne
- Nombre de queries bloquées par RLS
- Cross-tenant access attempts (devrait être 0)
- Slowest RLS policies
```

**Dashboard 3: Business Metrics**
```
- Active users (DAU/MAU)
- New signups par jour
- MRR (Monthly Recurring Revenue)
- Churn rate
```

**Dashboard 4: Security**
```
- Failed login attempts
- Rate limit hits
- Unauthorized access attempts (401/403)
- Suspicious IP addresses
```

---

### Étape 3.3: Créer dashboard custom simplifié

**Si pas de Grafana, créer dashboard HTML simple**:

**Créer**: `public/admin/observability-dashboard.html`
```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>HCM Portal - Observability</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
  <h1>HCM Portal - Observability Dashboard</h1>

  <div>
    <h2>API Health (Last 24h)</h2>
    <canvas id="apiHealthChart"></canvas>
  </div>

  <div>
    <h2>Recent Errors</h2>
    <table id="errorsTable">
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Error</th>
          <th>User</th>
          <th>Correlation ID</th>
        </tr>
      </thead>
      <tbody></tbody>
    </table>
  </div>

  <script>
    // Fetch metrics from Supabase Edge Function
    async function loadMetrics() {
      const response = await fetch('/functions/v1/get-observability-metrics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });
      const data = await response.json();

      // Render charts
      renderApiHealthChart(data.apiHealth);
      renderErrorsTable(data.recentErrors);
    }

    function renderApiHealthChart(data) {
      const ctx = document.getElementById('apiHealthChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(d => d.hour),
          datasets: [{
            label: 'Requests/hour',
            data: data.map(d => d.count),
            borderColor: 'rgb(75, 192, 192)',
          }]
        }
      });
    }

    function renderErrorsTable(errors) {
      const tbody = document.querySelector('#errorsTable tbody');
      tbody.innerHTML = errors.map(err => `
        <tr>
          <td>${new Date(err.timestamp).toLocaleString()}</td>
          <td>${err.message}</td>
          <td>${err.user_id}</td>
          <td><code>${err.correlation_id}</code></td>
        </tr>
      `).join('');
    }

    loadMetrics();
    setInterval(loadMetrics, 60000); // Refresh every minute
  </script>
</body>
</html>
```

**Créer Edge Function**: `supabase/functions/get-observability-metrics/index.ts`
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withAuth, successResponse } from "../_shared/middleware.ts";

serve(async (req) => {
  const { context, error } = await withAuth(req, {
    allowedRoles: ['CEO', 'RH_MANAGER'], // Only admins can see metrics
  });

  if (error) return error;

  // Query logs for metrics (simplified example)
  const { data: logs } = await context.supabaseClient
    .from('audit_logs')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  // Aggregate metrics
  const apiHealth = aggregateByHour(logs);
  const recentErrors = logs?.filter(l => l.operation === 'ERROR').slice(0, 10);

  return successResponse({
    apiHealth,
    recentErrors,
  }, context.correlationId);
});
```

---

## 🚀 PHASE 4: Alerting - 30 min

### Étape 4.1: Configurer alertes Sentry

1. **Sentry Dashboard** → **Alerts** → **Create Alert Rule**

2. **Alert 1: High Error Rate**
   - Condition: Error count > 10 dans 5 minutes
   - Action: Email + Slack (si configuré)
   - Severity: Critical

3. **Alert 2: P95 Latency**
   - Condition: Transaction duration P95 > 1000ms
   - Action: Email
   - Severity: Warning

4. **Alert 3: New Issue**
   - Condition: First seen error
   - Action: Email
   - Severity: Info

### Étape 4.2: Uptime monitoring (UptimeRobot)

1. Créer compte **UptimeRobot** (gratuit pour 50 monitors)
2. Ajouter monitors:

**Monitor 1: API Health**
```
URL: https://yhidlozgpvzsroetjxqb.supabase.co/rest/v1/
Type: HTTP(s)
Interval: 5 minutes
Alert: Email si down
```

**Monitor 2: Edge Function**
```
URL: https://yhidlozgpvzsroetjxqb.supabase.co/functions/v1/analyze-performance
Type: HTTP(s) (expect 401 - auth required)
Interval: 5 minutes
Alert: Email si status != 401
```

**Monitor 3: Frontend**
```
URL: https://votre-domain.vercel.app/
Type: HTTP(s)
Interval: 5 minutes
Alert: Email si down
```

---

## 🚀 PHASE 5: Distributed Tracing (Optionnel) - 2h

**Note**: Pour apps avec microservices complexes. Peut être skip pour MVP.

### Étape 5.1: OpenTelemetry setup

**Install OpenTelemetry dans Edge Function**:
```typescript
import { trace, SpanStatusCode } from "https://esm.sh/@opentelemetry/api@1.x";
import { NodeTracerProvider } from "https://esm.sh/@opentelemetry/sdk-trace-node@1.x";

const provider = new NodeTracerProvider();
provider.register();

const tracer = trace.getTracer('hcm-portal-backend');

serve(async (req) => {
  const span = tracer.startSpan('analyze-performance');

  try {
    // Your logic
    span.setStatus({ code: SpanStatusCode.OK });
  } catch (error) {
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.recordException(error);
  } finally {
    span.end();
  }
});
```

**Export vers Honeycomb ou Jaeger**:
```typescript
import { OTLPTraceExporter } from "https://esm.sh/@opentelemetry/exporter-trace-otlp-http@1.x";

const exporter = new OTLPTraceExporter({
  url: 'https://api.honeycomb.io/v1/traces',
  headers: {
    'x-honeycomb-team': Deno.env.get('HONEYCOMB_API_KEY'),
  },
});
```

---

## 📊 MÉTRIQUES CRITIQUES À TRACKER

### The Four Golden Signals (Google SRE)

| Signal | Métrique | Target | Alerting |
|--------|----------|--------|----------|
| **Latency** | P95 request duration | < 500ms | > 1000ms |
| **Traffic** | Requests per second | N/A | Track trends |
| **Errors** | Error rate | < 1% | > 5% |
| **Saturation** | DB connection pool | < 80% | > 90% |

### RED Metrics (API monitoring)

| Métrique | Description | Target |
|----------|-------------|--------|
| **Rate** | Requests/second | Track baseline |
| **Errors** | Error percentage | < 1% |
| **Duration** | P50/P95/P99 latency | P95 < 500ms |

### USE Metrics (Resource monitoring)

| Métrique | Description | Target |
|----------|-------------|--------|
| **Utilization** | % of resource used | < 80% |
| **Saturation** | Queue depth | < 10 |
| **Errors** | Error count | 0 |

---

## 🎯 SLOs/SLIs Recommandés

**SLO** = Service Level Objective (objectif)
**SLI** = Service Level Indicator (métrique mesurée)

### SLO 1: Availability
```
SLI: % de requêtes réussies (status 2xx)
SLO: 99.9% (3 nines)
Error budget: 0.1% (43 minutes downtime/mois)
```

### SLO 2: Latency
```
SLI: P95 latency des API calls
SLO: < 500ms pour 95% des requêtes
Error budget: 5% des requêtes peuvent être > 500ms
```

### SLO 3: Data Integrity
```
SLI: % de cross-tenant queries bloquées par RLS
SLO: 100% (tolerance 0)
Error budget: 0 cross-tenant leaks tolérés
```

---

## 🔍 RUNBOOKS - Procédures d'Incident

### Runbook 1: High Error Rate Alert

**Trigger**: Error rate > 5% pendant 5 minutes

**Steps**:
1. Ouvrir Sentry → Issues → Trier par "Last Seen"
2. Identifier l'erreur la plus fréquente
3. Consulter correlation_id dans Supabase Logs
4. Vérifier:
   - Changements récents (Git commits dernières 24h)
   - Migrations récentes (supabase/migrations)
   - Pic de traffic inhabituel
5. Si erreur critique:
   - Rollback dernier deploy (GitHub → Revert commit)
   - Ou disable feature avec feature flag
6. Communiquer status:
   - Email users affectés
   - Update status page
7. Post-mortem dans 48h

### Runbook 2: RLS Data Leakage Suspected

**Trigger**: Log montre cross-tenant query success

**Steps**:
1. **CRITICAL - Act immediately**
2. Vérifier RLS status:
   ```sql
   SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
   ```
3. Si RLS désactivée:
   ```sql
   ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
   ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
   ```
4. Investiguer:
   - Qui a désactivé RLS? (audit_logs)
   - Quelles données ont été exposées?
   - Quels users affectés?
5. Notification GDPR si nécessaire
6. Post-mortem obligatoire

### Runbook 3: Database Connection Saturation

**Trigger**: DB connection pool > 90%

**Steps**:
1. Identifier queries lentes:
   ```sql
   SELECT * FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '30 seconds';
   ```
2. Kill queries longues si nécessaire:
   ```sql
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <PID>;
   ```
3. Vérifier indexes manquants:
   ```sql
   SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0 AND seq_scan > 1000;
   ```
4. Scaler DB instance si recurring issue

---

## ✅ CHECKLIST D'IMPLÉMENTATION

### Phase 1: Immediate (Aujourd'hui)
- [ ] Vérifier Sentry frontend fonctionne
- [ ] Activer Supabase Logs (Database + Functions + API)
- [ ] Déployer middleware.ts dans toutes Edge Functions
- [ ] Configurer 1 alert Sentry (high error rate)

### Phase 2: This Week
- [ ] Créer uptime monitors (UptimeRobot)
- [ ] Documenter 3 runbooks principaux
- [ ] Setup daily review of Supabase Reports dashboard
- [ ] Test end-to-end tracing avec correlation IDs

### Phase 3: This Month
- [ ] Implémenter dashboard custom (si pas Grafana)
- [ ] Définir SLOs formels (availability, latency, integrity)
- [ ] Setup OpenTelemetry (si microservices complexes)
- [ ] Automated monthly observability report

---

## 📚 RESSOURCES

### Documentation
- [Supabase Logging](https://supabase.com/docs/guides/platform/logs)
- [Sentry Deno SDK](https://docs.sentry.io/platforms/javascript/guides/deno/)
- [OpenTelemetry Spec](https://opentelemetry.io/docs/specs/otel/)
- [Google SRE Book](https://sre.google/sre-book/monitoring-distributed-systems/)

### Tools
- [Sentry](https://sentry.io) - Error tracking
- [Grafana Cloud](https://grafana.com/products/cloud/) - Dashboards
- [UptimeRobot](https://uptimerobot.com) - Uptime monitoring
- [Honeycomb](https://honeycomb.io) - Distributed tracing

---

**Créé**: 2025-11-16
**Maintenu par**: DevOps Team
**Review**: Mensuel
**Statut**: ✅ Prêt pour implémentation

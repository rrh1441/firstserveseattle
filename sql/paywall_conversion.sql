-- Sample dataset for paywall conversion metrics
CREATE TEMP TABLE paywall_view(
    user_id integer,
    ab_group text
);

CREATE TEMP TABLE paywall_cta_click(
    user_id integer
);

CREATE TEMP TABLE trial_started(
    user_id integer
);

CREATE TEMP TABLE plan_activated(
    user_id integer
);

-- populate sample data
INSERT INTO paywall_view(user_id, ab_group) VALUES
    (1, 'A'),
    (2, 'A'),
    (3, 'B'),
    (4, 'B'),
    (5, 'B');

INSERT INTO paywall_cta_click(user_id) VALUES
    (1),
    (3),
    (4);

INSERT INTO trial_started(user_id) VALUES
    (1),
    (3);

INSERT INTO plan_activated(user_id) VALUES
    (1);

-- CTE calculating conversion metrics per ab_group
WITH views AS (
    SELECT ab_group, COUNT(DISTINCT user_id) AS view_count
    FROM paywall_view
    GROUP BY ab_group
),
cta AS (
    SELECT pv.ab_group, COUNT(DISTINCT c.user_id) AS click_count
    FROM paywall_view pv
    JOIN paywall_cta_click c ON c.user_id = pv.user_id
    GROUP BY pv.ab_group
),
trials AS (
    SELECT pv.ab_group, COUNT(DISTINCT t.user_id) AS trial_count
    FROM paywall_view pv
    JOIN trial_started t ON t.user_id = pv.user_id
    GROUP BY pv.ab_group
),
activations AS (
    SELECT pv.ab_group, COUNT(DISTINCT a.user_id) AS activation_count
    FROM paywall_view pv
    JOIN plan_activated a ON a.user_id = pv.user_id
    GROUP BY pv.ab_group
),
metrics AS (
    SELECT
        v.ab_group,
        v.view_count,
        COALESCE(c.click_count, 0) AS click_count,
        COALESCE(tr.trial_count, 0) AS trial_count,
        COALESCE(a.activation_count, 0) AS activation_count
    FROM views v
    LEFT JOIN cta c ON c.ab_group = v.ab_group
    LEFT JOIN trials tr ON tr.ab_group = v.ab_group
    LEFT JOIN activations a ON a.ab_group = v.ab_group
)
SELECT
    ab_group,
    view_count,
    click_count,
    trial_count,
    activation_count,
    ROUND(click_count::numeric / NULLIF(view_count, 0), 2)     AS click_rate,
    ROUND(trial_count::numeric / NULLIF(click_count, 0), 2)    AS trial_rate,
    ROUND(activation_count::numeric / NULLIF(trial_count, 0), 2) AS activation_rate
FROM metrics
ORDER BY ab_group;

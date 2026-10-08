--
-- Modifica data din cimpul nou data_ang din angajmente cu valorea corespunzatoare din anteeangajamente
--

UPDATE angajamente
INNER JOIN anteteangajamente ON angajamente.idAntet = anteteangajamente.id
SET angajamente.data_ang = anteteangajamente.dataang


--
-- SElecteaza categoriile cu sume din buget si sume deja angajate
--

SELECT c.id,c.denumire,c.buget,c.codCap,c.numecap,c.artbug, bug.total as crediteaprobate,@crediteangajate:=ifnull((SELECT sum(suma)  FROM adata.angajamente ang where data_ang>'2021-01-01' and ang.codCap = c.codCap and ang.artbug=c.artbug ),0) as crediteangajate,(bug.total-@crediteangajate) as disponibil  FROM adata.caategorii c
inner join adata.artbugete bug on bug.id=c.buget
where c.idcomp=14;
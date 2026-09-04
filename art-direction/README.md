# Direction artistique — norme de fidélité v2

Ce document est le contrat de production des illustrations. Il vise une représentation immédiatement reconnaissable et morphologiquement quasi canonique des créatures, tout en maintenant des images originales adaptées au jeu fan.

## Deux exigences indissociables

1. **Fidélité morphologique : 95/100 minimum.** La forme générale, les proportions, l'anatomie et les attributs distinctifs doivent identifier sans ambiguïté la créature représentée.
2. **Composition originale.** La pose, le cadrage, l'action, l'éclairage et l'environnement doivent être inventés pour le jeu. La fidélité à une espèce n'autorise jamais la reproduction d'une image officielle.

Une illustration qui satisfait une seule de ces exigences est refusée.

## Sources autorisées et interdites

Le relecteur peut étudier des sources canoniques afin d'établir des notes écrites sur la silhouette, l'anatomie, l'échelle, les matières et les attributs distinctifs. Ces notes constituent la seule référence transmise à la génération.

Il est interdit :

- de téléverser une image officielle, un scan, une capture, un photogramme ou un asset de production dans ImageGen;
- de demander ou conserver une reproduction d'affiche, de key art, de logo, de cadre de film ou de composition promotionnelle;
- d'imiter le visage d'un acteur ou d'une personne réelle;
- de copier exactement un costume, une arme, un accessoire, un véhicule ou un décor officiel identifiable;
- d'intégrer du texte, une marque, un filigrane, une interface ou un cadre de carte dans le bitmap.

Les références visuelles officielles ne sont ni ajoutées au dépôt, ni conservées dans les maîtres ou les données de génération.

## Grille de fidélité

Chaque axe reçoit une note entière de 0 à 100. Le total est une moyenne pondérée, sans arrondi ni bonus discrétionnaire :

| Axe du contrat | Poids | Attendu |
| --- | ---: | --- |
| `silhouette` | 25 % | Contour, posture, distribution des masses et famille immédiatement lisibles |
| `anatomy` | 25 % | Membres, articulations, tête, appendices et proportions cohérents |
| `signatureTraits` | 20 % | Toutes les ancres obligatoires visibles ou représentées sans ambiguïté |
| `surfaceLanguage` | 10 % | Peau, carapace, armure, tissu et mécanique propres à la famille |
| `scaleAndProportion` | 10 % | Échelle et proportions crédibles avec les sujets et le décor |
| `poseReadability` | 5 % | Pose lisible, sans fusion, occultation trompeuse ni raccourci qui masque la morphologie |
| `variantContinuity` | 5 % | Caste ou variante nommée distincte du profil générique |

Une tentative n'est acceptée que si son score pondéré atteint **95/100**, si **chaque axe atteint au moins 90/100**, si toutes les ancres obligatoires valent `true`, si `hardFails` est vide, si les assertions de conformité sont réussies et si le prompt de provenance est complet. Le score consigné doit être recalculable à partir des sept sous-scores.

Les neuf catégories de défaut bloquant du contrat couvrent : entrée visuelle officielle, composition officielle copiée, ressemblance d'acteur, branding officiel, ancre obligatoire manquante, mauvaise famille de sujet, erreur anatomique de génération, fuite de texte/instruction et asset externe sans licence. Un seul défaut bloque la tentative, quel que soit son score.

Les caractéristiques requises et interdites de chaque sujet sont versionnées dans le registre `avp-morphology-profiles.v1.json` et ses trois extensions déclarées : `avp-morphology-xenomorph-variants.v1.json`, `avp-morphology-yautja-variants.v1.json` et `avp-morphology-royal-hybrid-variants.v1.json`. Un profil dérivé cumule les ancres obligatoires de son profil de base et les siennes. Le profil applicable est toujours le plus précis; le profil générique ne peut pas servir à contourner les ancres d'une caste ou d'une variante connue. La revue v2 utilise le schéma `avp-art-review-v2`; les briefs, références textuelles, prompts et décisions détaillées restent privés, et seuls des agrégats de conformité sûrs peuvent être publiés.

## Humains et équipement

Un humain est évalué sur la fidélité de son rôle, sa fonction narrative, sa posture, sa catégorie d'équipement et les codes généraux de sa faction. Son visage doit être original. Sa tenue, son arme et ses accessoires doivent être des créations nouvelles et fonctionnelles, cohérentes avec le rôle, sans reproduire un costume, un accessoire de tournage ou une apparence d'acteur.

Pour un yautja masqué, la silhouette de l'espèce reste non négociable : haute carrure non humaine, volume crânien compatible avec les mandibules, quilles attachées anatomiquement, armure et charge fonctionnelles. Le biomask doit préserver cette lecture et les ancres de la variante choisie, mais sa géométrie fine, ses gravures et son agencement sont créés pour le projet; aucun accessoire officiel n'est reproduit à l'identique.

## Boucle de génération, revue et rejet

1. Rédiger les notes morphologiques et les contraintes d'originalité avant la génération.
2. Générer un seul asset avec un sujet, une action et une composition propres à la carte ou à la scène.
3. Inspecter le maître à sa résolution native, puis en vignette au format réel du jeu.
4. Attribuer chaque sous-score et consigner les défauts observés.
5. Si le total est inférieur à 95/100, si un axe est inférieur à 90/100, si une ancre échoue ou si un défaut bloquant existe, marquer l'asset **rejeté**.
6. Formuler une correction ciblée sur la morphologie fautive, sans relâcher les contraintes d'originalité, puis régénérer.
7. Reprendre la revue complète de la nouvelle proposition. Une tentative précédente ne transmet aucun point à la suivante.
8. Limiter chaque révision de brief à six tentatives. Après six rejets, réécrire matériellement le brief, incrémenter `briefRevision`, remettre `cycleAttempt` à 1 et conserver tout l'historique.
9. Publier uniquement la dernière tentative certifiée. Si aucune tentative n'est acceptable, retirer l'asset de la vague plutôt que d'abaisser le seuil ou de neutraliser une ancre.

Le registre de revue doit conserver au minimum l'identifiant de l'asset, les sous-scores, le score total, les défauts, le nombre de tentatives, l'identité du relecteur et la décision finale. Une réussite technique de décodage, de dimensions ou de build ne remplace pas cette revue visuelle.

## Migration de l'art v1

Les illustrations de la vague 1.0.0 sont **non certifiées v2**. Leur revue historique ne mesurait ni les sept axes, ni le plancher de 90/100 par axe, ni la grille pondérée à 95/100.

Il n'existe aucune rétro-certification automatique :

- l'ajout d'un champ ou le changement de version d'un manifeste ne suffit pas;
- chaque asset v1 commence en état de migration `pending` et doit être réellement réinspecté et scoré;
- tout asset v1 insuffisant doit être régénéré puis revu, ou retiré;
- seuls les assets ayant une preuve de revue v2 peuvent être présentés comme certifiés v2.

Jusqu'à la fin de cette migration, la provenance v1 reste valide mais ne constitue pas une preuve de fidélité morphologique v2.

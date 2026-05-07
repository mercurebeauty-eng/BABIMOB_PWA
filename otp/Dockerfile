# ════════════════════════════════════════════════════════════════════════
#  OpenTripPlanner 2 pour BABIMOB_PWA
#  Build : ~2-3 min. Graph construit au démarrage si absent.
# ════════════════════════════════════════════════════════════════════════

FROM eclipse-temurin:21-jre-alpine

ARG OTP_VERSION=2.6.0

WORKDIR /otp

# Télécharger l'uber-jar OTP officiel (depuis Maven Central)
ADD https://repo1.maven.org/maven2/org/opentripplanner/otp/${OTP_VERSION}/otp-${OTP_VERSION}-shaded.jar /otp/otp.jar

# Créer le dossier du graph (rempli par le script de build)
RUN mkdir -p /otp/graphs/abidjan

# Copier les données d'entrée + configs
COPY graphs/abidjan/ /otp/graphs/abidjan/

EXPOSE 8080

# Démarrage : build + serve.
#  --build : construit le graph depuis les fichiers (GTFS + OSM) si absent
#  --save  : persiste graph.obj pour les prochains démarrages
#  --serve : lance le serveur HTTP
#
# Mémoire : -Xmx1500m suffit pour Abidjan seul. Monter à 2500m si tu ajoutes
# un extract régional plus large.
CMD ["sh", "-c", "if [ ! -f /otp/graphs/abidjan/graph.obj ]; then java -Xmx1500m -jar otp.jar --build --save /otp/graphs/abidjan; fi && java -Xmx1500m -jar otp.jar --load --serve /otp/graphs/abidjan"]
